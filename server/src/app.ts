import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { planetRouter } from './routes/planets.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'planet-manager-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/planets', planetRouter);
