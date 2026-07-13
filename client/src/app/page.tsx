"use client";

import { useState } from 'react';
import { AppShell } from '../components/ui/shell';
import { postReview } from '../lib/api';

const starterCode = `function greet(name) {
  if (name) {
    console.log('Hello');
  }
}

const unusedValue = 42;
`;

export default function Home() {
  const [code, setCode] = useState(starterCode);
  const [filename, setFilename] = useState('example.js');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await postReview({ code, filename });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">AI Code Review</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Review code in one smooth flow</h1>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              Static + AI review ready
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Filename</label>
              <input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0"
                placeholder="example.js"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Code</label>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="min-h-[320px] w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-mono text-sm text-slate-100 outline-none"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Reviewing…' : 'Submit for Review'}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">What happens next</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Static checks run first for syntax, structure, and quality signals.</li>
              <li>• The AI review then adds deeper insights and suggestions.</li>
              <li>• Results are returned as a polished analysis report.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Review output</h2>
            {result ? (
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <p className="font-semibold text-cyan-300">Static analysis</p>
                  <p className="mt-2">Language: {result.staticAnalysis?.language}</p>
                  <p>Complexity: {result.staticAnalysis?.metrics?.complexityScore}</p>
                  <p>Functions: {result.staticAnalysis?.metrics?.totalFunctions}</p>
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3">
                  <p className="font-semibold text-violet-300">AI review</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-200">{result.aiReview?.summary}</p>
                </div>
                <div className="rounded-2xl border border-white/10 p-3">
                  <p className="font-semibold text-white">Issues found</p>
                  <ul className="mt-2 space-y-2">
                    {result.staticAnalysis?.issues?.map((issue: any, index: number) => (
                      <li key={`${issue.title}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                        <span className="mr-2 text-xs uppercase tracking-[0.2em] text-cyan-300">{issue.severity}</span>
                        {issue.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Your review results will appear here after submission.</p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
