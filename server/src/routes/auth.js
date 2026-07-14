import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, saveRefreshToken, revokeRefreshToken } from '../services/database.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'dev_secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;

function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'User already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashed });
    return res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

    const accessToken = createAccessToken(user);
    const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });

    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await saveRefreshToken({ token: refreshToken, userId: user.id, expiresAt });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await revokeRefreshToken(token);
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '') || null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ id: payload.sub, email: payload.email, name: payload.name });
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
});

export default router;
