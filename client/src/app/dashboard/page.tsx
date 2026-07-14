"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/ui/shell';
import { CodeEditor } from '../../components/editor/CodeEditor';
import { createChat, deleteChat, editChatTitle, fetchChatMessages, listChats, postChatMessage } from '../../lib/api';
import { me } from '../../lib/auth';

const starterPrompt = '';
const starterCode = '';

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

export default function DashboardPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [code, setCode] = useState(starterCode);
  const [prompt, setPrompt] = useState(starterPrompt);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = await me();
      if (!user) {
        router.replace('/login');
        return;
      }
      setAuthLoading(false);
      if (user.name) setUserName(user.name);
      const data = await listChats();
      setChats(data);
      if (data[0]) {
        setActiveChatId(data[0].id);
        const chatMessages = await fetchChatMessages(data[0].id);
        setMessages(chatMessages);
      }
    };
    load().catch((err) => {
      console.error(err);
      router.replace('/login');
    });
  }, [router]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);

  const handleStartNewChat = async () => {
    try {
      const chat = await createChat();
      setChats((current) => [chat, ...current]);
      setActiveChatId(chat.id);
      setMessages([]);
      setPrompt('');
      setCode('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start a new chat.');
    }
  };

  const handleRenameChat = async () => {
    if (!activeChat) return;
    const title = window.prompt('Enter a new chat title:', activeChat.title);
    if (!title) return;

    try {
      const updated = await editChatTitle(activeChat.id, title.trim());
      setChats((current) => current.map((chat) => (chat.id === updated.id ? updated : chat)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to rename the chat.');
    }
  };

  const handleDeleteChat = async () => {
    if (!activeChatId) return;
    const confirm = window.confirm('Delete this chat? This action cannot be undone.');
    if (!confirm) return;

    try {
      await deleteChat(activeChatId);
      setChats((current) => current.filter((chat) => chat.id !== activeChatId));

      const nextChat = chats.find((chat) => chat.id !== activeChatId);
      if (nextChat) {
        setActiveChatId(nextChat.id);
        const nextMessages = await fetchChatMessages(nextChat.id);
        setMessages(nextMessages);
      } else {
        setActiveChatId(null);
        setMessages([]);
        setPrompt('');
        setCode('');
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the chat.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeChatId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await postChatMessage({ chatId: activeChatId, content: prompt, code, file: selectedFile });
      setMessages(response.messages || []);
      setChats((current) => {
        const existing = current.find((chat) => chat.id === response.chat.id);
        if (existing) return [response.chat, ...current.filter((chat) => chat.id !== response.chat.id)];
        return [response.chat, ...current];
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the review.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="min-h-[540px] flex items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/75 p-8 text-slate-400">
          Checking authentication...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{userName ? `${userName}'s chats` : 'Your chats'}</h2>
            </div>
            <button onClick={handleStartNewChat} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15">
              New chat
            </button>
          </div>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">No chats yet. Create one to start reviewing code.</div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={async () => {
                    setActiveChatId(chat.id);
                    const chatMessages = await fetchChatMessages(chat.id);
                    setMessages(chatMessages);
                  }}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${activeChatId === chat.id ? 'border-cyan-400/30 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-slate-200/20 hover:bg-slate-800/75'}`}
                >
                  <p className="font-semibold">{chat.title}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(chat.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">AI Review</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{activeChat?.title || 'Chat workspace'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">Paste code directly, upload files, and get a review response that understands your project.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRenameChat}
                disabled={!activeChat}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rename chat
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={!activeChat}
                className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete chat
              </button>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Realtime code feedback</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Upload file
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
                  >
                    {loading ? 'Reviewing…' : 'Review code'}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                {selectedFile ? <p className="text-sm text-cyan-300">File selected: {selectedFile.name}</p> : null}

                <div className="space-y-3">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Review prompt</p>
                      <span className="text-xs text-slate-500">Sent exactly as written</span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      className="min-h-[120px] w-full resize-none rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30"
                      placeholder="Describe what you want the review to focus on..."
                    />
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Code editor</div>
                    <CodeEditor value={code} onChange={setCode} placeholder="Paste code or upload a file for review..." />
                  </div>
                </div>
              </form>

              {error ? <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
            </div>

            <aside className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Editor tools</p>
                <p className="mt-3 text-sm text-slate-400">Use the code editor above to paste full files or snippets. Upload a file if you want the assistant to analyze an actual source file.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Chat response</p>
                <p className="mt-3 text-sm text-slate-400">The assistant responds below based on your current prompt and code state.</p>
              </div>
            </aside>
          </div>

          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-[1.75rem] border p-5 transition ${message.role === 'user' ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/10 bg-slate-950/80'}`}>
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">{message.role === 'user' ? 'You' : 'Assistant'}</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{message.content}</p>
                {message.code ? <pre className="mt-4 overflow-x-auto rounded-3xl bg-slate-900/90 p-4 text-xs text-slate-300">{message.code}</pre> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
