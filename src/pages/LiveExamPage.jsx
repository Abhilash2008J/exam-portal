import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flag, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { currentStudentId } from '../lib/appwrite';
import { getExam, listAttemptsForStudent, parseQuestions, submitAttempt } from '../lib/data';
import { Button, Card, LoadingScreen, Modal, Notice, PageHeading } from '../components/ui';
import { ResultSummary, ReviewQuestion } from './StudentPages';

function durationLabel(seconds) { const safe = Math.max(0, seconds); return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`; }

export function LiveExamPage() {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = currentStudentId(user);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [result, setResult] = useState(null);
  const answersRef = useRef([]);
  const isSubmittingRef = useRef(false);
  const suppressViolationRef = useRef(false);
  const detachListenersRef = useRef(() => {});
  const finishRef = useRef(() => {});
  const pendingTerminatedRef = useRef(false);
  const timerRef = useRef(null);
  const questions = useMemo(() => exam ? parseQuestions(exam.q) : [], [exam]);
  const pendingStorageKey = `examportal:pending-attempt:${studentId}:${examId}`;

  useEffect(() => {
    let live = true;
    Promise.all([getExam(examId), listAttemptsForStudent(studentId)]).then(async ([doc, priorAttempts]) => {
      if (!live) return;
      const prior = priorAttempts.find((attempt) => attempt.eid === examId);
      if (prior) { window.localStorage.removeItem(pendingStorageKey); navigate('/history', { replace: true }); return; }
      if (!doc.p) { setError('This exam is not currently published.'); return; }
      setExam(doc);
      const qs = parseQuestions(doc.q);
      if (!qs.length) { setError('This exam does not contain any readable questions.'); return; }
      const pendingRaw = window.localStorage.getItem(pendingStorageKey);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending.userId === user.$id && pending.studentId === studentId && pending.examId === examId) {
          const savedAnswers = Array.isArray(pending.answers) ? pending.answers : Array(qs.length).fill(-1);
          answersRef.current = savedAnswers;
          pendingTerminatedRef.current = true;
          setAnswers(savedAnswers);
          setSubmitting(true);
          try {
            const saved = await submitAttempt({ studentId, userId: user.$id, exam: doc, answers: savedAnswers, terminated: true });
            if (!live) return;
            window.localStorage.removeItem(pendingStorageKey);
            setResult(saved);
          } catch (reason) {
            if (live) setSubmissionError(`A previous interrupted attempt is waiting to be saved: ${reason?.message || 'Appwrite request failed.'} Keep this page open and retry.`);
          } finally { if (live) setSubmitting(false); }
          return;
        }
        window.localStorage.removeItem(pendingStorageKey);
      }
      const initialAnswers = Array(qs.length).fill(-1);
      answersRef.current = initialAnswers;
      setAnswers(initialAnswers);
      setSecondsLeft(Number(doc.d) * 60);
    }).catch((reason) => { if (live) setError(reason?.message || 'Unable to open this exam.'); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [examId, studentId, user, navigate, pendingStorageKey]);

  const finish = useCallback(async (terminated = false) => {
    if (isSubmittingRef.current || !exam) return;
    pendingTerminatedRef.current = pendingTerminatedRef.current || terminated;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmissionError('');
    setShowConfirm(false);
    suppressViolationRef.current = true;
    detachListenersRef.current();
    if (timerRef.current) window.clearInterval(timerRef.current);
    document.body.classList.remove('exam-active');
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    try {
      const saved = await submitAttempt({ studentId, userId: user.$id, exam, answers: [...answersRef.current], terminated: pendingTerminatedRef.current });
      window.localStorage.removeItem(pendingStorageKey);
      setResult(saved);
      setActive(false);
      setSubmitting(false);
    } catch (reason) {
      isSubmittingRef.current = false;
      setActive(false);
      setSubmitting(false);
      setSubmissionError(`Your attempt could not be saved: ${reason?.message || 'Appwrite request failed.'} Keep this page open and retry.`);
    }
  }, [exam, studentId, user, pendingStorageKey]);
  finishRef.current = finish;

  useEffect(() => {
    if (!active || result) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          finishRef.current(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    timerRef.current = timer;
    return () => window.clearInterval(timer);
  }, [active, result]);

  useEffect(() => {
    if (!active || result) return undefined;
    const onViolation = () => { if (!suppressViolationRef.current) finishRef.current(true); };
    const onVisibility = () => { if (document.hidden) onViolation(); };
    const onFullscreen = () => { if (!document.fullscreenElement) onViolation(); };
    const onBeforeUnload = () => {
      try {
        window.localStorage.setItem(pendingStorageKey, JSON.stringify({ userId: user.$id, studentId, examId, answers: [...answersRef.current], terminated: true }));
      } catch { /* The live Appwrite request below remains a best-effort fallback. */ }
      onViolation();
    };
    const onPopState = () => { onViolation(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onViolation);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    const onContextMenu = (event) => event.preventDefault();
    const onCopyPaste = (event) => event.preventDefault();
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopyPaste);
    document.addEventListener('paste', onCopyPaste);
    const detach = () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onViolation);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopyPaste);
      document.removeEventListener('paste', onCopyPaste);
    };
    detachListenersRef.current = detach;
    return detach;
  }, [active, result, pendingStorageKey, user, studentId, examId]);

  useEffect(() => () => {
    detachListenersRef.current();
    if (timerRef.current) window.clearInterval(timerRef.current);
    document.body.classList.remove('exam-active');
  }, []);

  const begin = async () => {
    setError('');
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      suppressViolationRef.current = false;
      document.body.classList.add('exam-active');
      setActive(true);
    } catch {
      setError('Fullscreen could not be started. Allow fullscreen for this site, then choose Begin Test again.');
    }
  };

  const chooseAnswer = (optionIndex) => {
    const next = [...answersRef.current];
    next[questionIndex] = optionIndex;
    answersRef.current = next;
    setAnswers(next);
  };

  if (loading) return <LoadingScreen label="Checking exam availability" />;
  if (error && !exam) return <Notice type="error" title="Exam unavailable">{error}<div className="mt-3"><Button variant="secondary" onClick={() => navigate('/exams')}>Back to exams</Button></div></Notice>;
  if (result && exam) {
    const savedAnswers = JSON.parse(result.a || '[]');
    return <div className="mx-auto max-w-5xl soft-enter"><PageHeading eyebrow={result.trm ? 'Terminated attempt' : 'Exam submitted'} title="Your result" description={`${exam.t} · Your attempt has been saved.`} />{result.trm && <div className="mb-5"><Notice type="error" title="Attempt terminated">This exam was terminated because fullscreen was exited or the browser lost focus. Your selected answers were saved, and the attempt is locked.</Notice></div>}<ResultSummary attempt={result} /><div className="mt-7 space-y-4"><h2 className="font-display text-2xl text-ink">Answer review</h2>{questions.map((question, index) => <ReviewQuestion key={index} question={question} answer={savedAnswers[index] ?? -1} index={index} />)}</div><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate('/history')}>Go to previous exams<ArrowRight size={15} /></Button><Button variant="secondary" onClick={() => navigate('/dashboard')}>View dashboard</Button></div></div>;
  }
  if (!exam) return null;
  if (!active) return <div className="mx-auto max-w-3xl soft-enter"><button onClick={() => navigate('/exams')} className="mb-6 text-xs font-semibold text-[#748091] hover:text-cobalt">← Back to available exams</button><PageHeading eyebrow="Before you begin" title={exam.t} description="Take a moment to review the exam conditions before starting." /><Card className="p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-3"><Rule icon={Clock3} label="Duration" value={`${exam.d} minutes`} /><Rule icon={CheckCircle2} label="Questions" value={`${questions.length} total`} /><Rule icon={ShieldAlert} label="Attempts" value="One only" /></div><div className="my-7 border-t border-[#efede8]" /><h2 className="font-semibold text-ink">Exam rules</h2><ul className="mt-3 space-y-3 text-sm leading-6 text-[#697687]"><li className="flex gap-2"><span className="font-bold text-cobalt">01</span><span>The exam opens in fullscreen. Do not switch tabs, minimize the browser, or exit fullscreen; any of these actions immediately terminates the attempt.</span></li><li className="flex gap-2"><span className="font-bold text-cobalt">02</span><span>You may move between questions using the numbered palette and change your answers until you submit or time expires.</span></li><li className="flex gap-2"><span className="font-bold text-cobalt">03</span><span>Correct answers earn one mark. Wrong and unanswered questions earn zero marks. You cannot retake a submitted or terminated exam.</span></li></ul>{error && <div className="mt-5"><Notice type="error">{error}</Notice></div>}{submissionError && <div className="mt-5"><Notice type="error" title="Submission could not be saved">{submissionError}<div className="mt-2"><Button onClick={() => finishRef.current(pendingTerminatedRef.current)}>Retry submission</Button></div></Notice></div>}<div className="mt-7 flex flex-col gap-3 border-t border-[#efede8] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#87909d]">Starting confirms that you understand and agree to these conditions.</p><Button onClick={begin} disabled={submitting}>{submitting ? 'Saving attempt…' : 'Begin Test'}<ArrowRight size={15} /></Button></div></Card></div>;

  const current = questions[questionIndex];
  const answeredCount = answers.filter((answer) => answer >= 0).length;
  const unansweredCount = questions.length - answeredCount;
  const requestSubmit = () => setShowConfirm(true);
  const previous = () => setQuestionIndex((index) => Math.max(0, index - 1));
  const next = () => { if (questionIndex === questions.length - 1) requestSubmit(); else setQuestionIndex((index) => Math.min(questions.length - 1, index + 1)); };

  return <div className="mx-auto max-w-7xl soft-enter"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8390a0]">Live assessment</div><h1 className="mt-1 font-display text-2xl text-ink">{exam.t}</h1></div><div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${secondsLeft < 60 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[#e3e5eb] bg-white text-ink'}`}><Clock3 size={16} /><span className="font-mono text-lg font-bold tabular-nums">{durationLabel(secondsLeft)}</span></div></div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><Card className="min-h-[520px] p-5 sm:p-8"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-[#7e8998]">Question {questionIndex + 1} <span className="mx-1 text-[#b5bac3]">/</span> {questions.length}</div><div className="text-xs text-[#8893a1]">{answeredCount} answered</div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eeece7]"><div className="h-full rounded-full bg-cobalt transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><div className="mt-9"><h2 className="max-w-3xl font-display text-2xl leading-snug text-ink sm:text-3xl">{current.q}</h2><p className="mt-2 text-xs text-[#8b95a2]">Choose one answer</p></div><div className="mt-7 space-y-3">{current.o.map((option, optionIndex) => { const selected = answers[questionIndex] === optionIndex; return <label key={optionIndex} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${selected ? 'border-cobalt bg-[#f3f5fd] ring-1 ring-cobalt/20' : 'border-[#e8e5de] bg-white hover:border-[#bcc8ee] hover:bg-[#fcfcff]'}`}><input className="sr-only" type="radio" name={`question-${questionIndex}`} value={optionIndex} checked={selected} onChange={() => chooseAnswer(optionIndex)} /><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-cobalt text-white' : 'bg-[#f0efeb] text-[#687587]'}`}>{String.fromCharCode(65 + optionIndex)}</span><span className={`text-sm ${selected ? 'font-semibold text-ink' : 'text-[#536071]'}`}>{option}</span><span className="ml-auto">{selected && <CheckCircle2 size={17} className="text-cobalt" />}</span></label>; })}</div><div className="mt-9 flex items-center justify-between border-t border-[#efede8] pt-5"><Button variant="secondary" onClick={previous} disabled={questionIndex === 0}><ArrowLeft size={15} />Previous</Button><Button onClick={next}>{questionIndex === questions.length - 1 ? 'Submit Exam' : 'Next'}{questionIndex === questions.length - 1 ? <Flag size={15} /> : <ArrowRight size={15} />}</Button></div></Card>
      <aside className="space-y-4"><Card className="p-5"><div className="flex items-start justify-between"><div><div className="text-sm font-semibold text-ink">Question palette</div><p className="mt-1 text-xs text-[#8992a0]">Jump to any question</p></div><button onClick={requestSubmit} disabled={submitting} className="text-xs font-semibold text-cobalt hover:underline">Submit exam</button></div><div className="mt-5 grid grid-cols-5 gap-2">{questions.map((_, index) => { const currentQ = index === questionIndex; const answered = answers[index] >= 0; return <button key={index} onClick={() => setQuestionIndex(index)} aria-label={`Go to question ${index + 1}${answered ? ', answered' : ', unanswered'}`} className={`flex h-10 items-center justify-center rounded-lg border text-xs font-bold transition ${currentQ ? 'border-cobalt bg-cobalt text-white ring-2 ring-cobalt/20' : answered ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400' : 'border-[#e6e3dc] bg-[#f7f6f3] text-[#7d8795] hover:border-[#bfc8e2]'}`}>{index + 1}</button>; })}</div><div className="mt-5 space-y-2 border-t border-[#efede8] pt-4 text-[10px] text-[#778292]"><Legend color="bg-cobalt" label="Current" /><Legend color="bg-emerald-100" label="Answered" /><Legend color="bg-[#f0efeb]" label="Unanswered" /></div><div className="mt-5 rounded-xl bg-[#f6f5f1] p-3 text-xs leading-5 text-[#778292]">Leaving fullscreen or switching away will automatically submit this attempt as terminated.</div></Card><Button className="w-full" onClick={requestSubmit} disabled={submitting}><Flag size={15} />Submit Exam</Button></aside></div>
    {submitting && <div className="fixed inset-0 z-40 grid place-items-center bg-[#152137]/35"><div className="rounded-xl bg-white px-6 py-5 text-sm font-semibold text-ink shadow-xl">Saving your attempt…</div></div>}
    {submissionError && <div className="mt-4"><Notice type="error" title="Submission could not be saved">{submissionError}<div className="mt-2"><Button onClick={() => finishRef.current(pendingTerminatedRef.current)}>Retry submission</Button></div></Notice></div>}
    {showConfirm && <Modal title="Submit this exam?" onClose={() => setShowConfirm(false)} footer={<><Button variant="secondary" onClick={() => setShowConfirm(false)}>Keep working</Button><Button onClick={() => finishRef.current(false)}>Submit exam</Button></>}><p className="text-sm leading-6 text-[#6d7888]">Your answers are final once submitted. You have answered <strong className="text-ink">{answeredCount}</strong> question{answeredCount === 1 ? '' : 's'} and left <strong className="text-ink">{unansweredCount}</strong> unanswered.</p></Modal>}
  </div>;
}

function Rule({ icon: Icon, label, value }) { return <div className="rounded-xl bg-[#f7f6f3] p-4"><Icon className="mb-3 text-cobalt" size={18} /><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#858f9d]">{label}</div><div className="mt-1 text-sm font-semibold text-ink">{value}</div></div>; }
function Legend({ color, label }) { return <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-sm ${color}`} />{label}</div>; }
