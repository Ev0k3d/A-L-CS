import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth.js';

export type AuthedRequest = Request & { userId?: string; userEmail?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
