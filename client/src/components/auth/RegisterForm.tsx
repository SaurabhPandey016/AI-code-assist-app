"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '../../lib/auth';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await register({ name, email, password });
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="space-y-2 pb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Start reviewing</p>
        <h1 className="text-3xl font-semibold text-white">Create your account</h1>
        <p className="mx-auto max-w-xs text-sm text-slate-400">Build your private workspace for AI-assisted code reviews and file-based analysis.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-200">
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            placeholder="Your name"
          />
        </label>
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
            placeholder="Create a password"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

      <p className="mt-6 text-center text-sm text-slate-400">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
