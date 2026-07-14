"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../components/ui/shell';
import { createChat, fetchChatMessages, listChats, postChatMessage } from '../lib/api';

const starterPrompt = `Please review this code and explain the main issues and improvements.`;
const starterCode = `function greet(name) {
  if (name) {
    console.log('Hello');
  }
}

const unusedValue = 42;
`;

type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
};

type MessageItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string | null;
  filename?: string | null;
};

export default function Home() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [prompt, setPrompt] = useState(starterPrompt);
  const [code, setCode] = useState(starterCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await listChats();
        setChats(data);
        if (data[0]) {
          setActiveChatId(data[0].id);
          const chatMessages = await fetchChatMessages(data[0].id);
          setMessages(chatMessages);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadChats();
  }, []);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);

  const handleStartNewChat = async () => {
    try {
      const chat = await createChat();
      setChats((current) => [chat, ...current]);
      setActiveChatId(chat.id);
      setMessages([]);
      setPrompt(starterPrompt);
      setCode(starterCode);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start a new chat.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeChatId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postChatMessage({
        chatId: activeChatId,
        content: prompt,
        code,
        file: selectedFile,
      });

      setMessages(response.messages || []);
      setChats((current) => {
        const existing = current.find((chat) => chat.id === response.chat.id);
        if (existing) {
          return [response.chat, ...current.filter((chat) => chat.id !== response.chat.id)];
        }
        return [response.chat, ...current];
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Chats</p>
              <h2 className="text-lg font-semibold text-white">Review history</h2>
            </div>
            <button onClick={handleStartNewChat} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">New chat</button>
          </div>

          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={async () => {
                  setActiveChatId(chat.id);
                  const chatMessages = await fetchChatMessages(chat.id);
                  setMessages(chatMessages);
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${activeChatId === chat.id ? 'border-cyan-400/30 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/60 text-slate-300 hover:bg-slate-800/70'}`}
              >
                <p className="font-medium">{chat.title}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(chat.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">AI Code Review</p>
              <h1 className="text-2xl font-semibold text-white">{activeChat?.title || 'Your review workspace'}</h1>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              Static + AI review in one step
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  Upload code file
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                {selectedFile ? <span className="text-sm text-cyan-300">{selectedFile.name}</span> : <span className="text-sm text-slate-400">Upload a file to review it as a unique submission.</span>}
              </div>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-100 outline-none"
                placeholder="Describe the code issue or paste your request here..."
              />
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="min-h-60 w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 font-mono text-sm text-slate-100 outline-none"
                spellCheck={false}
                placeholder="Paste or edit your code here..."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-400">The app will run static analysis first and then produce an AI review for the same submission.</p>
                <button type="submit" disabled={loading} className="rounded-full bg-linear-to-r from-cyan-400 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70">
                  {loading ? 'Reviewing…' : 'Review code'}
                </button>
              </div>
            </form>
          </div>

          {error ? <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div> : null}

          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-3xl border p-4 ${message.role === 'user' ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/10 bg-slate-950/60'}`}>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">{message.role === 'user' ? 'You' : 'Assistant'}</p>
                <p className="whitespace-pre-wrap text-sm text-slate-200">{message.content}</p>
                {message.code ? <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-900/70 p-3 text-xs text-slate-300">{message.code}</pre> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
