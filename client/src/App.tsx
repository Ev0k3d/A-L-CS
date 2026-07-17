import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { PlanetCreationPage } from './pages/PlanetCreationPage';
import { PlanetDashboardPage } from './pages/PlanetDashboardPage';
import { PlanetSelectPage } from './pages/PlanetSelectPage';
import { useAuthStore } from './store/auth';

function Protected({ children }: { children: ReactElement }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
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
