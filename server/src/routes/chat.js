import express from 'express';
import multer from 'multer';
import { analyzeCode } from '../services/staticAnalysis.js';
import { generateAiReview } from '../services/aiReview.js';
import { uploadToSupabase } from '../services/storage.js';
import {
  createChatRecord,
  createMessageRecord,
  deriveChatTitle,
  getMessagesByChat,
  getChatsByUser,
  findChatById,
  updateChatTitle,
  deleteChat,
} from '../services/database.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

router.get('/chats', async (req, res) => {
  try {
    const userId = req.user?.id;
    const chats = await getChatsByUser(userId);
    return res.json(chats);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load chats.' });
  }
});

router.post('/chats', async (req, res) => {
  try {
    const userId = req.user?.id;
    const chat = await createChatRecord({ title: 'New chat', userId });
    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create chat.' });
  }
});

router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await findChatById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (chat.userId && chat.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You do not have permission to access this chat.' });
    }

    const messages = await getMessagesByChat(chatId);
    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load chat messages.' });
  }
});

router.post('/chats/:chatId/messages', upload.single('file'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', code = '' } = req.body;
    const file = req.file;

    let chat = await findChatById(chatId);
    if (!chat) {
      const userId = req.user?.id;
      chat = await createChatRecord({ title: 'New chat', userId });
    }

    let resolvedCode = code || '';
    let uploadedFileMeta = null;
    let filename = '';

    if (file) {
      const fileText = file.buffer ? file.buffer.toString('utf8') : '';

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

    const userMessage = await createMessageRecord({
      chatId: chat.id,
      role: 'user',
      content: content || 'Uploaded code',
      code: resolvedCode,
      filename,
    });

    const assistantMessage = await createMessageRecord({
      chatId: chat.id,
      role: 'assistant',
      content: aiReview.summary,
      code: JSON.stringify(staticAnalysis),
      filename,
    });

    const messages = await getMessagesByChat(chat.id);

    if (!chat.title || chat.title === 'New chat') {
      const title = deriveChatTitle(content, filename || 'chat-input');
      chat = await updateChatTitle(chat.id, title);
    }

    res.status(200).json({
      chat,
      messages,
      staticAnalysis,
      aiReview,
      upload: uploadedFileMeta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Unable to review this submission.' });
  }
});

router.patch('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'A valid title is required.' });
    }

    const chat = await findChatById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (chat.userId && chat.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You do not have permission to update this chat.' });
    }

    const updatedChat = await updateChatTitle(chatId, title.trim());
    return res.json(updatedChat);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update chat title.' });
  }
});

router.delete('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await findChatById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (chat.userId && chat.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this chat.' });
    }

    await deleteChat(chatId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete chat.' });
  }
});

export default router;
