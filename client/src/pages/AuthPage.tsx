import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Panel } from '../components/Panel';

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await api<{ token: string; user: { id: string; email: string; displayName: string } }>(
        `/auth/${isRegister ? 'register' : 'login'}`,
        { method: 'POST', body: isRegister ? { email, password, displayName } : { email, password } }
      );
      setAuth(result.token, result.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Panel title={isRegister ? 'Create Command Profile' : 'Sign In'}>
        <form className="space-y-4" onSubmit={submit}>
          {isRegister ? (
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Display name</span>
              <input className="w-full border border-slate-700 bg-slate-900 p-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Email</span>
            <input className="w-full border border-slate-700 bg-slate-900 p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Password</span>
            <input className="w-full border border-slate-700 bg-slate-900 p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button className="w-full border border-blue-400 bg-blue-500/20 py-2 text-sm font-semibold text-blue-100" type="submit">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button className="mt-4 text-sm text-slate-400 hover:text-slate-100" onClick={() => setIsRegister((v) => !v)}>
          {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </Panel>
    </div>
  );
}
