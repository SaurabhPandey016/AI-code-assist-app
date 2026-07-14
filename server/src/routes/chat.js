import express from 'express';
import multer from 'multer';
import { analyzeCode } from '../services/staticAnalysis.js';
import { generateAiReview } from '../services/aiReview.js';
import { uploadToSupabase } from '../services/storage.js';
import { createChatRecord, createMessageRecord, deriveChatTitle } from '../services/database.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

const chats = [];
const messagesByChat = new Map();

router.get('/chats', (_req, res) => {
  res.json(chats);
});

router.post('/chats', (req, res) => {
  const chat = createChatRecord({ title: 'New chat' });
  chats.unshift(chat);
  messagesByChat.set(chat.id, []);
  res.status(201).json(chat);
});

router.post('/chats/:chatId/messages', upload.single('file'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', code = '' } = req.body;
    const file = req.file;

    let chat = chats.find((entry) => entry.id === chatId);
    if (!chat) {
      chat = createChatRecord({ title: 'New chat' });
      chats.unshift(chat);
      messagesByChat.set(chat.id, []);
    }

    let resolvedCode = code || '';
    let uploadedFileMeta = null;
    let filename = '';

    if (file) {
      const fileText = await file.text();

      try {
        uploadedFileMeta = await uploadToSupabase({ file });
        resolvedCode = uploadedFileMeta.publicUrl || fileText || resolvedCode;
        filename = uploadedFileMeta.originalName || file.originalname;
      } catch (error) {
        console.warn('File upload failed, using file contents directly.', error.message);
        resolvedCode = fileText || resolvedCode;
        filename = file.originalname;
      }
    }

    const combinedText = [content, resolvedCode].filter(Boolean).join('\n\n');
    const staticAnalysis = analyzeCode({ code: resolvedCode, filename: filename || 'chat-input' });
    const aiReview = await generateAiReview({ code: combinedText, staticAnalysis, filename: filename || 'chat-input' });

    const userMessage = createMessageRecord({
      chatId: chat.id,
      role: 'user',
      content: content || 'Uploaded code',
      code: resolvedCode,
      filename,
    });

    const assistantMessage = createMessageRecord({
      chatId: chat.id,
      role: 'assistant',
      content: aiReview.summary,
      code: JSON.stringify(staticAnalysis),
      filename,
    });

    const existingMessages = messagesByChat.get(chat.id) || [];
    existingMessages.push(userMessage, assistantMessage);
    messagesByChat.set(chat.id, existingMessages);

    if (!chat.title || chat.title === 'New chat') {
      chat.title = deriveChatTitle(content, filename || 'chat-input');
    }

    res.status(200).json({
      chat,
      messages: existingMessages,
      staticAnalysis,
      aiReview,
      upload: uploadedFileMeta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Unable to review this submission.' });
  }
});

router.get('/chats/:chatId/messages', (req, res) => {
  const messages = messagesByChat.get(req.params.chatId) || [];
  res.json(messages);
});

export default router;
