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

type ReviewBlock =
  | { type: 'section'; title: string; summary: string; notes: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

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
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    return chats.filter((chat) => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [chats, searchTerm]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant') ?? null,
    [messages]
  );

  const reviewPoints = useMemo(() => {
    if (!latestAssistantMessage?.content) return 0;
    const bullets = latestAssistantMessage.content
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('-') && line.trim().length > 3);
    if (bullets.length > 0) {
      return Math.min(100, bullets.length * 15);
    }

    const sentences = latestAssistantMessage.content.split(/[.!?]/).filter((part) => part.trim().length > 10);
    return Math.min(100, Math.max(10, sentences.length * 12));
  }, [latestAssistantMessage]);

  const reviewSummary = latestAssistantMessage?.content || 'Submit a review to see detailed assistant feedback here.';

  const buildReviewBlocks = (content: string): ReviewBlock[] => {
    const normalized = content.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const paragraphs = normalized.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
    const blocks: ReviewBlock[] = [];

    paragraphs.forEach((block) => {
      const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const firstLine = lines[0] ?? '';
      const headingMatch = firstLine.match(/^([A-Za-z][A-Za-z\s&/()\-]+):\s*(.*)$/);

      if (headingMatch) {
        const title = headingMatch[1].trim();
        const summary = headingMatch[2].trim();
        const notes = lines.slice(1).map((line) => line.replace(/^[-•]\s*/, '')).filter(Boolean);

        blocks.push({
          type: 'section',
          title,
          summary: summary || notes[0] || '',
          notes,
        });
        return;
      }

      const bulletItems = lines.filter((line) => /^[-•]\s+/.test(line));
      if (bulletItems.length > 0) {
        blocks.push({
          type: 'list',
          items: bulletItems.map((line) => line.replace(/^[-•]\s*/, '').trim()),
        });
        return;
      }

      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    });

    return blocks;
  };

  const parsedReviewBlocks = useMemo(() => buildReviewBlocks(reviewSummary), [reviewSummary]);

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

    setRenameLoading(true);
    setActionMessage('Renaming chat...');

    try {
      const updated = await editChatTitle(activeChat.id, title.trim());
      setChats((current) => current.map((chat) => (chat.id === updated.id ? updated : chat)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to rename the chat.');
    } finally {
      setRenameLoading(false);
      setActionMessage(null);
    }
  };

  const handleDeleteChat = async () => {
    if (!activeChatId) return;
    const confirmDelete = window.confirm('Delete this chat? This action cannot be undone.');
    if (!confirmDelete) return;

    setDeleteLoading(true);
    setActionMessage('Deleting chat...');

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
    } finally {
      setDeleteLoading(false);
      setActionMessage(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() && !code.trim() && !selectedFile) {
      setError('Please paste code, upload a file, or add a prompt before reviewing.');
      return;
    }

    setLoading(true);
    setError(null);
    setActionMessage('Sending review request...');

    try {
      let chatId = activeChatId ?? '';
      if (!chatId) {
        const newChat = await createChat();
        setChats((current) => [newChat, ...current]);
        setActiveChatId(newChat.id);
        chatId = newChat.id;
      }

      const response = await postChatMessage({ chatId, content: prompt, code, file: selectedFile });
      setMessages(response.messages || []);
      setChats((current) => {
        const existing = current.find((chat) => chat.id === response.chat.id);
        if (existing) return [response.chat, ...current.filter((chat) => chat.id !== response.chat.id)];
        return [response.chat, ...current];
      });
      setSelectedFile(null);
      setPrompt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActionMessage('Review complete.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the review.');
      setActionMessage('Review failed.');
    } finally {
      setLoading(false);
      window.setTimeout(() => setActionMessage(null), 2500);
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
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{userName ? `${userName}'s chats` : 'Your chats'}</h2>
            </div>
            <button onClick={handleStartNewChat} className="cursor-pointer rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15">
              New chat
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="chat-search" className="sr-only">Search chats</label>
            <input
              id="chat-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30"
            />
          </div>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">No chats yet. Create one to start reviewing code.</div>
            ) : (
              filteredChats.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">No chats match your search. Try a different keyword or create a new chat.</div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={async () => {
                      setActiveChatId(chat.id);
                      const chatMessages = await fetchChatMessages(chat.id);
                      setMessages(chatMessages);
                    }}
                    className={`cursor-pointer w-full rounded-3xl border px-4 py-4 text-left transition ${activeChatId === chat.id ? 'border-cyan-400/30 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-slate-200/20 hover:bg-slate-800/75'}`}
                  >
                    <p className="font-semibold">{chat.title}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(chat.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )
            )}
          </div>
        </aside>

        <section className="space-y-5 rounded-[2rem] border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-5">
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
                disabled={!activeChat || renameLoading}
                className="cursor-pointer rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {renameLoading ? 'Renaming…' : 'Rename chat'}
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={!activeChat || deleteLoading}
                className="cursor-pointer rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete chat'}
              </button>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Realtime code feedback</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Upload file
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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

              {actionMessage ? <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">{actionMessage}</div> : null}
              {error ? <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
            </div>

            <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-3">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Editor tools</p>
                <p className="mt-2 text-sm text-slate-400">Use the editor to paste code, upload files, and generate review outcomes.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-3">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Review details</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-100">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Latest review</p>
                    <div className="mt-2 max-h-[280px] space-y-2 overflow-y-auto pr-1 text-[12px] leading-5 text-slate-300">
                      {parsedReviewBlocks.map((block, index) => {
                        if (block.type === 'section') {
                          return (
                            <div key={`${block.title}-${index}`} className="rounded-xl border border-white/5 bg-slate-900/80 p-2">
                              <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-cyan-300">{block.title}</p>
                              <p className="text-slate-100">{block.summary}</p>
                              {block.notes.length > 0 ? (
                                <div className="mt-2 space-y-1 text-slate-200">
                                  {block.notes.map((item, noteIndex) => (
                                    <p key={`${block.title}-${noteIndex}`} className="leading-5">{item}</p>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        if (block.type === 'list') {
                          return (
                            <div key={`list-${index}`} className="rounded-xl border border-white/5 bg-slate-900/80 p-2">
                              <div className="space-y-1 text-slate-200">
                                {block.items.map((item, itemIndex) => (
                                  <p key={`list-${itemIndex}`} className="leading-5">{item}</p>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={`paragraph-${index}`} className="rounded-xl border border-white/5 bg-slate-900/80 p-2 text-slate-200">
                            {block.text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-100">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Review score</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <span className="text-3xl font-semibold text-cyan-300">{reviewPoints}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">/100</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${reviewPoints}%` }} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-100">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Messages</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-300">{messages.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-100">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Active chat</p>
                      <p className="mt-2 text-sm font-semibold text-slate-200">{activeChat?.title || 'No chat selected'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              const reviewBlocks = buildReviewBlocks(message.content);

              return (
                <div key={message.id} className={`w-full rounded-[1.4rem] border p-4 transition ${message.role === 'user' ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/10 bg-slate-950/80'}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{message.role === 'user' ? 'You' : 'Assistant'}</p>
                    <span className="rounded-full bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">{message.role === 'user' ? 'Prompt' : 'Response'}</span>
                  </div>
                  <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/90 p-3">
                    {isAssistant ? (
                      <div className="max-w-[72ch] space-y-2 text-[13px] leading-6 text-slate-100">
                        {reviewBlocks.map((block, index) => {
                          if (block.type === 'section') {
                            return (
                              <div key={`${message.id}-${block.title}-${index}`} className="rounded-xl border border-white/5 bg-slate-950/70 p-3">
                                <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-cyan-300">{block.title}</p>
                                <p className="text-slate-100">{block.summary}</p>
                                {block.notes.length > 0 ? (
                                  <div className="mt-2 space-y-1 text-slate-200">
                                    {block.notes.map((item, noteIndex) => (
                                      <p key={`${message.id}-${block.title}-${noteIndex}`} className="leading-5">{item}</p>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }

                          if (block.type === 'list') {
                            return (
                              <div key={`${message.id}-list-${index}`} className="rounded-xl border border-white/5 bg-slate-950/70 p-3">
                                <div className="space-y-1 text-slate-200">
                                  {block.items.map((item, itemIndex) => (
                                    <p key={`${message.id}-item-${itemIndex}`} className="leading-5">{item}</p>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <p key={`${message.id}-paragraph-${index}`} className="rounded-xl border border-white/5 bg-slate-950/70 p-3 text-slate-200">
                              {block.text}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="max-w-[72ch] whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-100">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.code ? (
                    <pre className="mt-3 w-full max-w-full overflow-x-auto rounded-2xl bg-slate-900/90 p-3 text-[11px] leading-5 text-slate-300">
                      {message.code}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
