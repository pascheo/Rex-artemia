import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import responsesRoutes from './routes/responses';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/report';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env['NODE_ENV'] === 'production' ? FRONTEND_URL : true,
    credentials: true,
  })
);

// ── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/report', reportRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route introuvable' });
});

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[POC Artemia Backend] Listening on port ${PORT} — ${process.env['NODE_ENV'] ?? 'development'}`);
});
