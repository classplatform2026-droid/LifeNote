import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserStore } from '../db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'lifenote-super-secure-jwt-secret-2026';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await UserStore.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired.' });
    }

    req.userId = user._id;
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}
