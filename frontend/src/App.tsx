import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/Loading';
import { Shell } from './components/Shell';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingPage } from './pages/BookingPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';

function PrivateArea() {
  const { user, checking } = useAuth();
  if (checking) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell><Outlet /></Shell>;
}

function PublicOnly({ mode }: { mode: 'login' | 'register' }) {
  const { user, checking } = useAuth();
  if (checking) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage mode={mode} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly mode="login" />} />
      <Route path="/cadastro" element={<PublicOnly mode="register" />} />
      <Route element={<PrivateArea />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agendar" element={<BookingPage />} />
        <Route path="/minhas-consultas" element={<MyAppointmentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
