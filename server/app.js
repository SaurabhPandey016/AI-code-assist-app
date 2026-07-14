import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chat.js';
import authRoutes from './src/routes/auth.js';
import { requireAuth } from './src/middleware/auth.js';
import cookieParser from 'cookie-parser';
import errorHandler from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use('/api', authRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'Server is healthy' });
});

// Protect chat routes - require a valid access token
app.use('/api', requireAuth, chatRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is now running on PORT : ${PORT}`);
});