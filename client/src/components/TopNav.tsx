import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function TopNav() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Planet Manager</div>
      <nav className="flex items-center gap-4 text-sm text-slate-300">
        <Link to="/" className="hover:text-white">Home</Link>
        <Link to="/create" className="hover:text-white">New Planet</Link>
        <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
        {user ? <span className="text-slate-400">{user.displayName}</span> : null}
        {user ? (
          <button className="border border-slate-700 px-2 py-1 hover:bg-slate-800" onClick={logout}>Logout</button>
        ) : (
          <Link to="/auth" className="border border-slate-700 px-2 py-1 hover:bg-slate-800">Login</Link>
        )}
      </nav>
    </header>
  );
}
