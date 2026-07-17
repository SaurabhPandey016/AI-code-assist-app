"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logout as clientLogout, me } from '../../lib/auth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const info = await me();
        setUser(info || null);
      } catch (e) {
        setUser(null);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 font-semibold shadow-lg shadow-cyan-500/20">
              AI
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-cyan-300">CODE REVIEW</p>
              <p className="text-lg font-semibold text-white">Assistant</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">Home</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
                <Link href="/profile" className="transition hover:text-white">Profile</Link>
                <span className="text-sm text-slate-200">{user.name || user.email}</span>
                <button onClick={() => { clientLogout(); setUser(null); window.location.href = '/'; }} className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-100">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="transition hover:text-white">Login</Link>
                <Link href="/register" className="transition hover:text-white">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
