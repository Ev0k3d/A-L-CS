import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api/client';
import { TopNav } from './components/TopNav';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { PlanetCreationPage } from './pages/PlanetCreationPage';
import { PlanetDashboardPage } from './pages/PlanetDashboardPage';
import { PlanetSelectPage } from './pages/PlanetSelectPage';
import { useAuthStore } from './store/auth';

function Protected({ children }: { children: ReactElement }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const ready = useAuthStore((s) => s.ready);
  if (!ready) return null;
  if (!accessToken) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { accessToken, setUser, clearAuth, ready, setReady } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!accessToken) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const user = await api<{ id: string; email: string; displayName: string }>('/auth/me');
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, setUser, clearAuth, setReady]);

  if (!ready) {
    return <div className="min-h-screen bg-transparent text-slate-100" />;
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <TopNav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/create" element={<Protected><PlanetCreationPage /></Protected>} />
        <Route path="/dashboard" element={<Protected><PlanetSelectPage /></Protected>} />
        <Route path="/dashboard/:planetId" element={<Protected><PlanetDashboardPage /></Protected>} />
      </Routes>
    </div>
  );
}
