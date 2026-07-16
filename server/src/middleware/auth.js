import jwt from 'jsonwebtoken';
import { findRefreshToken } from '../services/database.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'dev_secret';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const bearerToken = auth.replace(/^Bearer\s+/i, '') || null;
    let payload = null;

    if (bearerToken) {
      payload = jwt.verify(bearerToken, JWT_SECRET);
    } else {
      const cookieToken = req.cookies?.refreshToken || null;
      if (!cookieToken) return res.status(401).json({ message: 'Not authenticated' });

      const validToken = await findRefreshToken(cookieToken);
      if (!validToken) return res.status(401).json({ message: 'Not authenticated' });

      payload = jwt.verify(cookieToken, JWT_SECRET);
    }

    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}
