import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sign in to your workspace</h1>
        <p className="mt-3 text-sm text-slate-400">Review code with a calm, productive, and beautiful workflow.</p>
        <div className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" placeholder="Email" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" placeholder="Password" type="password" />
          <button className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white">Continue</button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          New here?{' '}
          <Link href="/register" className="text-cyan-300">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
