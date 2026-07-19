import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import { findRefreshToken, findUserByEmail, findUserById, createUser, saveRefreshToken, revokeRefreshToken, updateUserProfile } from '../services/database.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'dev_secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

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

    const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });

    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await saveRefreshToken({ token: refreshToken, userId: user.id, expiresAt });

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await revokeRefreshToken(token);
    res.clearCookie('refreshToken', { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const cookieToken = req.cookies?.refreshToken || null;
    if (!cookieToken) return res.status(401).json({ message: 'Not authenticated' });
    const validToken = await findRefreshToken(cookieToken);
    if (!validToken) return res.status(401).json({ message: 'Not authenticated' });
    const payload = jwt.verify(cookieToken, JWT_SECRET);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
});

router.patch('/auth/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name && !email && !password) {
      return res.status(400).json({ message: 'Provide at least one field to update.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (email) {
      const existing = await findUserByEmail(email);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
    }

    const nextPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const user = await updateUserProfile({
      userId,
      name: typeof name === 'string' ? name.trim() : undefined,
      email: typeof email === 'string' ? email.trim() : undefined,
      password: nextPassword,
    });

    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Profile update failed.' });
  }
});

export default router;
