const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

export function getAccessToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

export async function register(payload: { name?: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (data.accessToken) setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (e) {
    // ignore
  }
  setAccessToken(null);
}

export async function me(token?: string) {
  const t = token || getAccessToken();
  if (!t) return null;
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) return null;
  return res.json();
}

export default {
  register,
  login,
  logout,
  me,
  getAccessToken,
  setAccessToken,
};
