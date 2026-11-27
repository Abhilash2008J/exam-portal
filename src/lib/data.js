import { appwriteConfig, databases, ensureAppwriteConfig, ID, Permission, Query, Role } from './appwrite';

const db = appwriteConfig.databaseId;
const exams = appwriteConfig.examsId;
const attempts = appwriteConfig.attemptsId;

function ready() {
  ensureAppwriteConfig();
}

export async function listExams({ publishedOnly = false } = {}) {
  ready();
  const queries = [Query.limit(100)];
  if (publishedOnly) queries.push(Query.equal('p', true));
  const result = await databases.listDocuments(db, exams, queries);
  return result.documents;
}

export async function listAttemptsForStudent(studentId) {
  ready();
  const result = await databases.listDocuments(db, attempts, [
    Query.equal('uid', studentId),
    Query.limit(100),
    Query.orderDesc('ts'),
  ]);
  return result.documents;
}

export async function listAllAttempts() {
  ready();
  const result = await databases.listDocuments(db, attempts, [Query.limit(100), Query.orderDesc('ts')]);
  return result.documents;
}

export async function getExam(examId) {
  ready();
  return databases.getDocument(db, exams, examId);
}

export async function getAttempt(attemptId) {
  ready();
  return databases.getDocument(db, attempts, attemptId);
}

export async function createExam({ title, duration, questions }) {
  ready();
  const compactQuestions = JSON.stringify(questions.map((item) => ({ q: item.q.trim(), o: item.o.map((option) => option.trim()), c: Number(item.c) })));
  if (compactQuestions.length > 65000) {
    throw new Error(`The compact question paper is ${compactQuestions.length} characters; Appwrite allows at most 65,000.`);
  }
  return databases.createDocument(db, exams, ID.unique(), {
    t: title.trim(),
    d: Number(duration),
    q: compactQuestions,
    p: true,
    ts: Math.floor(Date.now() / 1000),
  });
}

export async function updateExam(examId, values) {
  ready();
  return databases.updateDocument(db, exams, examId, values);
}

export async function deleteExam(examId) {
  ready();
  return databases.deleteDocument(db, exams, examId);
}

export async function submitAttempt({ studentId, userId, exam, answers, terminated = false }) {
  ready();
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.read(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ];
  const questions = parseQuestions(exam.q);
  const score = questions.reduce((sum, question, index) => sum + (answers[index] === Number(question.c) ? 1 : 0), 0);
  return databases.createDocument(db, attempts, ID.unique(), {
    uid: studentId,
    eid: exam.$id,
    et: exam.t,
    a: JSON.stringify(answers),
    s: score,
    tot: questions.length,
    trm: Boolean(terminated),
    ts: Math.floor(Date.now() / 1000),
  }, permissions);
}

export function parseQuestions(compact) {
  try {
    const questions = typeof compact === 'string' ? JSON.parse(compact) : compact;
    if (!Array.isArray(questions)) return [];
    return questions.map((question) => ({
      q: String(question?.q ?? ''),
      o: Array.isArray(question?.o) ? question.o.map(String) : [],
      c: Number.isInteger(Number(question?.c)) ? Number(question.c) : 0,
    }));
  } catch {
    return [];
  }
}

export function parseAnswers(compact) {
  try {
    const answers = typeof compact === 'string' ? JSON.parse(compact) : compact;
    return Array.isArray(answers) ? answers.map((answer) => Number(answer)) : [];
  } catch {
    return [];
  }
}

export function attemptPercent(attempt) {
  return attempt?.tot ? Math.round((Number(attempt.s) / Number(attempt.tot)) * 100) : 0;
}
