import { useAuthStore } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

type RequestConfig = {
  method?: string;
  body?: unknown;
};

export async function api<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}${path}`, {
    method: config.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {})
    },
    body: config.body ? JSON.stringify(config.body) : undefined
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
    throw new Error(payload.error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}
