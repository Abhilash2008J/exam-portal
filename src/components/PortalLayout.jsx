import { BookOpenCheck, ChartNoAxesCombined, ClipboardList, House, LogOut, ShieldCheck, Timer, UserRound } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { to: '/exams', label: 'Exams', icon: ClipboardList },
  { to: '/history', label: 'Previous Exams', icon: Timer },
];

export function Brand({ inverse = false }) {
  return <div className={`flex items-center gap-3 ${inverse ? 'text-white' : 'text-ink'}`}><div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-cobalt text-white"><BookOpenCheck size={21} strokeWidth={1.8} /><i className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#bfcaff]" /></div><div className="leading-tight"><div className="font-semibold tracking-tight">Exam Portal</div><div className={`mt-1 text-[10px] uppercase tracking-[.15em] ${inverse ? 'text-white/60' : 'text-[#87909d]'}`}>Assessment space</div></div></div>;
}

export function PortalLayout({ children, admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = admin ? [{ to: '/admin/dashboard', label: 'Admin workspace', icon: ShieldCheck }] : studentLinks;
  const liveExam = !admin && location.pathname.startsWith('/exam/');
  const handleLogout = async () => { await logout(); navigate(admin ? '/admin/login' : '/', { replace: true }); };
  const initials = (user?.name || user?.email || 'S').slice(0, 1).toUpperCase();

  return <div className="min-h-screen bg-paper">
    <header className="sticky top-0 z-30 border-b border-[#e9e6de] bg-[#fbfaf7]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-10">
        <Brand />
        {!liveExam ? <nav aria-label={admin ? 'Administrator navigation' : 'Student navigation'} className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive || (to === '/history' && location.pathname.startsWith('/history/')) ? 'bg-[#e9edfb] text-cobalt' : 'text-[#687485] hover:bg-white hover:text-ink'}`}><Icon size={16} />{label}</NavLink>)}
        </nav> : <div className="hidden text-xs font-semibold text-[#738091] md:block">Exam in progress</div>}
        <div className="flex items-center gap-2 sm:gap-3"><div className="hidden text-right sm:block"><div className="text-xs font-semibold text-ink">{admin ? 'Administrator' : user?.name || 'Student'}</div><div className="mt-0.5 text-[10px] text-[#8992a0]">{admin ? 'Workspace' : user?.email?.split('@')[0]}</div></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3e8f7] text-sm font-semibold text-cobalt"><UserRound size={17} />{!user?.name && <span className="sr-only">{initials}</span>}</div><button onClick={handleLogout} disabled={liveExam} title={liveExam ? 'Submit or terminate the exam before leaving' : undefined} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#687485] hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-45" aria-label="Logout"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button></div>
      </div>
      {!liveExam && <nav aria-label="Mobile navigation" className="flex overflow-x-auto border-t border-[#efede7] px-3 py-1.5 md:hidden">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${isActive || (to === '/history' && location.pathname.startsWith('/history/')) ? 'text-cobalt' : 'text-[#748091]'}`}><Icon size={15} />{label}</NavLink>)}</nav>}
    </header>
    <main className="mx-auto min-h-[calc(100vh-74px)] max-w-[1380px] px-4 py-7 sm:px-7 sm:py-10 lg:px-10">{children}</main>
    <footer className="mx-auto flex max-w-[1380px] flex-col gap-2 px-4 pb-8 text-[11px] text-[#929aa5] sm:flex-row sm:justify-between sm:px-10"><span>Exam Portal · A clear, accountable place to sit the test.</span><span>{admin ? 'Administrator workspace' : 'Your progress is private to your account.'}</span></footer>
  </div>;
}
