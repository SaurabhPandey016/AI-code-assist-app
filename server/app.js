import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chat.js';
import authRoutes from './src/routes/auth.js';
import { requireAuth } from './src/middleware/auth.js';
import { countUsers, getAllUserEmails } from './src/services/database.js';
import cookieParser from 'cookie-parser';
import errorHandler from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use('/api', authRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    const users = await countUsers();
    // const emails = await getAllUserEmails();
    return res.status(200).json({ message: 'Server is healthy', userCount: users});
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ message: 'Health check failed' });
  }
});

// Protect chat routes - require a valid access token
app.use('/api', requireAuth, chatRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is now running on PORT : ${PORT}`);
});