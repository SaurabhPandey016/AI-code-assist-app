import { randomUUID } from 'node:crypto';

function deriveChatTitle(message = '', filename = '') {
  const raw = (filename || message || '').trim();
  if (!raw) return 'New chat';

  const cleaned = raw
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'New chat';
}

function createMessageRecord({ chatId, role, content, code, filename, createdAt }) {
  return {
    id: randomUUID(),
    chatId,
    role,
    content,
    code: code || null,
    filename: filename || null,
    createdAt: createdAt || new Date().toISOString(),
  };
}

function createChatRecord({ id, title, createdAt }) {
  return {
    id: id || randomUUID(),
    title: title || 'New chat',
    createdAt: createdAt || new Date().toISOString(),
  };
}

export { createChatRecord, createMessageRecord, deriveChatTitle };
