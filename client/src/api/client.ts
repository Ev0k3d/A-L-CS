import { useAuthStore } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

type RequestConfig = {
  method?: string;
  body?: unknown;
};

let refreshPromise: Promise<string | null> | null = null;

type AuthApiResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
};

async function request(path: string, config: RequestConfig = {}, token?: string | null): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: config.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: config.body ? JSON.stringify(config.body) : undefined
  });
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
      if (!refreshToken) return null;
      const res = await request('/auth/refresh', { method: 'POST', body: { refreshToken } });
      if (!res.ok) {
        clearAuth();
        return null;
      }
      const data = (await res.json()) as AuthApiResponse;
      setAuth(data.accessToken, data.refreshToken, data.user);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function api<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  let res = await request(path, config, accessToken);

  const shouldAttemptRefresh =
    res.status === 401 &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/refresh';

  if (shouldAttemptRefresh) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      res = await request(path, config, nextAccessToken);
    }
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
    throw new Error(payload.error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}
