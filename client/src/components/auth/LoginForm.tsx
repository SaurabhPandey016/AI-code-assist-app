"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, me } from '../../lib/auth';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const user = await me();
      if (user) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="space-y-2 pb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
        <h1 className="text-3xl font-semibold text-white">Sign in to your code review dashboard</h1>
        <p className="mx-auto max-w-xs text-sm text-slate-400">Paste your code, upload a file, and get actionable review responses in one polished workspace.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-200">
          Email address
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-slate-200">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            placeholder="Enter your password"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

      <p className="mt-6 text-center text-sm text-slate-400">
        New to the workspace?{' '}
        <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Create an account
        </Link>
      </p>
    </div>
  );
}
