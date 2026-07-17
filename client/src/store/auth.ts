import { create } from 'zustand';
import type { User } from '../types/game';

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

const key = 'planet-manager-auth';

const initial = (() => {
  const raw = localStorage.getItem(key);
  if (!raw) return { token: null, user: null };
  try {
    return JSON.parse(raw) as { token: string | null; user: User | null };
  } catch {
    return { token: null, user: null };
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  user: initial.user,
  setAuth: (token, user) => {
    localStorage.setItem(key, JSON.stringify({ token, user }));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(key);
    set({ token: null, user: null });
  }
}));
