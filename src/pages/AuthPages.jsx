import { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/PortalLayout';
import { Button, Notice } from '../components/ui';
import { isAppwriteConfigured, missingConfig } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

function AuthFrame({ admin = false, children }) {
  return <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.02fr_.98fr]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#18263b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full border border-white/10" /><div className="absolute -right-10 top-10 h-72 w-72 rounded-full border border-white/10" /><div className="absolute bottom-24 left-16 h-44 w-44 rounded-full bg-cobalt/25 blur-3xl" />
      <Brand inverse />
      <div className="relative max-w-lg"><div className="mb-4 h-1 w-12 bg-[#7e98ff]" /><div className="font-display text-5xl leading-[1.08]">A clear space to focus, <span className="text-[#aebdff]">learn</span> and grow.</div><p className="mt-6 max-w-md text-base leading-7 text-white/65">One question at a time. Your progress stays in view.</p></div>
      <div className="text-xs text-white/45">EXAM PORTAL · ASSESSMENT SPACE</div>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-[430px]">
      <div className="mb-10 lg:hidden"><Brand /></div>{children}
      <div className="mt-9 border-t border-[#e8e5dd] pt-5 text-xs leading-5 text-[#87909d]">For account access or exam-day support, contact your institution administrator.</div>
    </div></section>
  </div>;
}

function ConfigMessage() {
  return !isAppwriteConfigured ? <Notice type="info" title="Appwrite setup required">Configure {missingConfig.join(', ')} in your local <code>.env</code> file using <code>.env.example</code>, then restart the site.</Notice> : null;
}

export function StudentLogin() {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await loginStudent(studentId, password); navigate('/home', { replace: true }); }
    catch (reason) { setError(reason?.message || 'Unable to sign in. Check your Student ID and password.'); }
    finally { setBusy(false); }
  };
  return <AuthFrame><div className="mb-8"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8ecfa] text-cobalt"><UserRound size={21} /></div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#7b8798]">Student access</p><h1 className="font-display text-4xl text-ink">Sign in to your portal</h1><p className="mt-3 text-sm leading-6 text-[#717d8d]">Use the Student ID and password provided by your school.</p></div>
    {!isAppwriteConfigured && <div className="mb-5"><ConfigMessage /></div>}{error && <div className="mb-5"><Notice type="error" title="Sign in failed">{error}</Notice></div>}
    <form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Student ID</span><input required autoComplete="username" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="w-full rounded-xl border border-[#dddcd7] bg-white px-4 py-3 text-sm outline-none transition focus:border-cobalt" placeholder="Enter your Student ID" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#dddcd7] bg-white px-4 py-3 text-sm outline-none transition focus:border-cobalt" placeholder="Enter your password" /></label><Button type="submit" disabled={busy || !isAppwriteConfigured} className="w-full py-3">{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={16} /></Button></form>
    <div className="mt-7 text-center"><Link to="/admin/login" className="text-xs font-medium text-[#7d8795] underline decoration-[#c8ccd4] underline-offset-4 hover:text-cobalt">Admin Login</Link></div>
  </AuthFrame>;
}

export function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { await loginAdmin(email, password); navigate('/admin/dashboard', { replace: true }); } catch (reason) { setError(reason?.message || 'Unable to sign in.'); } finally { setBusy(false); } };
  return <AuthFrame admin><div className="mb-8"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8ecfa] text-cobalt"><ShieldCheck size={21} /></div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#7b8798]">Administrator access</p><h1 className="font-display text-4xl text-ink">Workspace sign in</h1><p className="mt-3 text-sm leading-6 text-[#717d8d]">Use your Appwrite administrator email and password.</p></div>
    {!isAppwriteConfigured && <div className="mb-5"><ConfigMessage /></div>}{error && <div className="mb-5"><Notice type="error" title="Sign in failed">{error}</Notice></div>}
    <form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Email address</span><input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#dddcd7] bg-white px-4 py-3 text-sm outline-none focus:border-cobalt" placeholder="name@school.edu" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#dddcd7] bg-white px-4 py-3 text-sm outline-none focus:border-cobalt" placeholder="Enter password" /></label><Button type="submit" disabled={busy || !isAppwriteConfigured} className="w-full py-3">{busy ? 'Checking access…' : 'Sign in'}<KeyRound size={15} /></Button></form>
    <div className="mt-7 text-center"><Link to="/" className="text-xs font-medium text-[#7d8795] underline decoration-[#c8ccd4] underline-offset-4 hover:text-cobalt">Back to Student Login</Link></div>
  </AuthFrame>;
}
