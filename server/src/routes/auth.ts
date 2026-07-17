import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { generateRefreshToken, getRefreshTokenExpiresAt, hashRefreshToken, signAccessToken } from '../lib/auth.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';

export const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

authRouter.use(authLimiter);

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128).regex(/[a-z]/, 'Password must include a lowercase letter').regex(/[A-Z]/, 'Password must include an uppercase letter').regex(/\d/, 'Password must include a number'),
  displayName: z.string().trim().min(2).max(50)
});

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
};

async function createAuthResponse(user: { id: string; email: string; displayName: string }): Promise<AuthResponse> {
  const refreshToken = generateRefreshToken();
  await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt()
    }
  });

  return {
    accessToken: signAccessToken({ userId: user.id, email: user.email }),
    refreshToken,
    user: { id: user.id, email: user.email, displayName: user.displayName }
  };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { email, password, displayName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, displayName, passwordHash } });
  const auth = await createAuthResponse(user);
  res.status(201).json(auth);
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128)
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const auth = await createAuthResponse(user);
  res.json(auth);
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt });
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32)
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid refresh token' });
    return;
  }

  const refreshTokenHash = hashRefreshToken(parsed.data.refreshToken);
  const session = await prisma.authSession.findUnique({
    where: { refreshTokenHash },
    include: { user: true }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const nextRefreshToken = generateRefreshToken();
  const response = await prisma.$transaction(async (tx) => {
    await tx.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() }
    });

    await tx.authSession.create({
      data: {
        userId: session.userId,
        refreshTokenHash: hashRefreshToken(nextRefreshToken),
        expiresAt: getRefreshTokenExpiresAt()
      }
    });

    return {
      accessToken: signAccessToken({ userId: session.user.id, email: session.user.email }),
      refreshToken: nextRefreshToken,
      user: { id: session.user.id, email: session.user.email, displayName: session.user.displayName }
    };
  });

  res.json(response);
});

const logoutSchema = z.object({
  refreshToken: z.string().min(32)
});

authRouter.post('/logout', async (req, res) => {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid refresh token' });
    return;
  }

  await prisma.authSession.updateMany({
    where: { refreshTokenHash: hashRefreshToken(parsed.data.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() }
  });

  res.json({ ok: true });
});

authRouter.post('/logout-all', requireAuth, async (req: AuthedRequest, res) => {
  await prisma.authSession.updateMany({
    where: { userId: req.userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  res.json({ ok: true });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128).regex(/[a-z]/, 'Password must include a lowercase letter').regex(/[A-Z]/, 'Password must include an uppercase letter').regex(/\d/, 'Password must include a number')
});

authRouter.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    res.status(400).json({ error: 'New password must be different' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) }
    });
    await tx.authSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  });

  res.json({ ok: true });
});
