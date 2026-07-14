import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chat.js';
import errorHandler from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', chatRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'Server is healthy' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is now running on PORT : ${PORT}`);
});