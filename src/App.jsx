import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalLayout } from './components/PortalLayout';
import { StudentLogin, AdminLogin } from './pages/AuthPages';
import { HomePage, DashboardPage, ExamsPage, HistoryPage, ReviewPage } from './pages/StudentPages';
import { LiveExamPage } from './pages/LiveExamPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoadingScreen } from './components/ui';

function StudentGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen label="Checking your session" />;
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (user.labels?.includes('admin')) return <Navigate to="/admin/dashboard" replace />;
  return <PortalLayout>{children}</PortalLayout>;
}

function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Checking administrator access" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!user.labels?.includes('admin')) return <Navigate to="/" replace />;
  return <PortalLayout admin>{children}</PortalLayout>;
}

function RouteTree() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/" element={loading ? <LoadingScreen label="Loading Exam Portal" /> : user ? <Navigate to={user.labels?.includes('admin') ? '/admin/dashboard' : '/home'} replace /> : <StudentLogin />} />
      <Route path="/admin/login" element={loading ? <LoadingScreen label="Loading Exam Portal" /> : user?.labels?.includes('admin') ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />
      <Route path="/home" element={<StudentGuard><HomePage /></StudentGuard>} />
      <Route path="/dashboard" element={<StudentGuard><DashboardPage /></StudentGuard>} />
      <Route path="/exams" element={<StudentGuard><ExamsPage /></StudentGuard>} />
      <Route path="/history" element={<StudentGuard><HistoryPage /></StudentGuard>} />
      <Route path="/history/:attemptId" element={<StudentGuard><ReviewPage /></StudentGuard>} />
      <Route path="/exam/:examId" element={<StudentGuard><LiveExamPage /></StudentGuard>} />
      <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="*" element={<Navigate to={user?.labels?.includes('admin') ? '/admin/dashboard' : user ? '/home' : '/'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <HashRouter><AuthProvider><RouteTree /></AuthProvider></HashRouter>;
}
