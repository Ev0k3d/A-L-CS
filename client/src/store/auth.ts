import { create } from 'zustand';
import type { User } from '../types/game';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  ready: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setReady: (ready: boolean) => void;
};

const key = 'planet-manager-auth';

const initial = (() => {
  const raw = localStorage.getItem(key);
  if (!raw) return { accessToken: null, refreshToken: null, user: null };
  try {
    const parsed = JSON.parse(raw) as { accessToken?: string | null; refreshToken?: string | null; user: User | null; token?: string | null };
    return {
      accessToken: parsed.accessToken ?? parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  user: initial.user,
  ready: false,
  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem(key, JSON.stringify({ accessToken, refreshToken, user }));
    set({ accessToken, refreshToken, user });
  },
  setUser: (user) => {
    const { accessToken, refreshToken } = useAuthStore.getState();
    localStorage.setItem(key, JSON.stringify({ accessToken, refreshToken, user }));
    set({ user });
  },
  clearAuth: () => {
    localStorage.removeItem(key);
    set({ accessToken: null, refreshToken: null, user: null });
  },
  setReady: (ready) => set({ ready })
}));
