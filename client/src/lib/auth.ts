const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function register(payload: { name?: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Registration failed.');
  }

  return res.json();
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Login failed.');
  }

  return res.json();
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (e) {
    // ignore
  }
}

export async function updateProfile(payload: { name?: string; email?: string; password?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Profile update failed.');
  }

  return res.json();
}

export async function me() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export default {
  register,
  login,
  logout,
  me,
  updateProfile,
};
