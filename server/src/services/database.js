import { PrismaClient } from '../../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize Prisma');
}

const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
await prisma.$connect();

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

async function createChatRecord({ id, title, createdAt, userId } = {}) {
  return prisma.chat.create({ data: { id: id || undefined, title: title || 'New chat', userId } });
}

async function createMessageRecord({ chatId, role, content, code, filename } = {}) {
  return prisma.message.create({ data: { role, content, code, filename, chatId } });
}

async function getMessagesByChat(chatId) {
  return prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: 'asc' } });
}

async function getChatsByUser(userId) {
  return prisma.chat.findMany({
    where: { userId: userId || null },
    orderBy: { createdAt: 'desc' },
  });
}

async function findChatById(chatId) {
  return prisma.chat.findUnique({ where: { id: chatId } });
}

async function updateChatTitle(chatId, title) {
  return prisma.chat.update({ where: { id: chatId }, data: { title } });
}

async function deleteChat(chatId) {
  await prisma.message.deleteMany({ where: { chatId } });
  return prisma.chat.delete({ where: { id: chatId } });
}

async function createUser({ name, email, password }) {
  return prisma.user.create({ data: { name, email, password } });
}

async function saveRefreshToken({ token, userId, expiresAt }) {
  return prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
  return true;
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export {
  createChatRecord,
  createMessageRecord,
  deriveChatTitle,
  getMessagesByChat,
  getChatsByUser,
  findChatById,
  updateChatTitle,
  deleteChat,
  findUserByEmail,
  createUser,
  saveRefreshToken,
  revokeRefreshToken,
};
