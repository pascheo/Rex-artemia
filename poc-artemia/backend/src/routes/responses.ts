import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

const scoreValue = z.number().int().min(1).max(4);

const scoresSchema = z.object({
  A1: scoreValue, A2: scoreValue, A3: scoreValue,
  B1: scoreValue, B2: scoreValue, B3: scoreValue,
  C1: scoreValue, C2: scoreValue, C3: scoreValue,
  D1: scoreValue, D2: scoreValue, D3: scoreValue, D4: scoreValue, D5: scoreValue, D6: scoreValue,
  E1: scoreValue, E2: scoreValue,
  F1: scoreValue, F2: scoreValue, F3: scoreValue,
});

const responseSchema = z.object({
  casUsage: z.string().min(1, 'Le cas d\'usage est requis'),
  scores: scoresSchema,
  openG1: z.string().optional(),
  openG2: z.string().optional(),
  openG3: z.string().optional(),
  openG4: z.string().optional(),
});

router.use(authMiddleware);

// GET /api/responses/my - Get own response
router.get('/my', async (req: AuthRequest, res: Response): Promise<void> => {
  const response = await prisma.response.findUnique({
    where: { userId: req.user!.userId },
    include: { user: { select: { nom: true, direction: true } } },
  });
  res.json({ success: true, data: response ?? null });
});

// POST /api/responses - Submit response
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const config = await prisma.collectionConfig.findUnique({ where: { id: 1 } });
  if (!config?.isOpen) {
    res.status(403).json({ success: false, error: 'La collecte est actuellement clôturée' });
    return;
  }

  const parsed = responseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const existing = await prisma.response.findUnique({ where: { userId: req.user!.userId } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Vous avez déjà soumis une réponse. Utilisez PUT pour la modifier.' });
    return;
  }

  const response = await prisma.response.create({
    data: { userId: req.user!.userId, ...parsed.data },
  });

  res.status(201).json({ success: true, data: response });
});

// PUT /api/responses/my - Update own response
router.put('/my', async (req: AuthRequest, res: Response): Promise<void> => {
  const config = await prisma.collectionConfig.findUnique({ where: { id: 1 } });
  if (!config?.isOpen) {
    res.status(403).json({ success: false, error: 'La collecte est clôturée, modification impossible' });
    return;
  }

  const parsed = responseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const response = await prisma.response.upsert({
    where: { userId: req.user!.userId },
    update: parsed.data,
    create: { userId: req.user!.userId, ...parsed.data },
  });

  res.json({ success: true, data: response });
});

// GET /api/responses - Admin: all responses
router.get('/', adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const responses = await prisma.response.findMany({
    include: { user: { select: { nom: true, email: true, direction: true } } },
    orderBy: { submittedAt: 'desc' },
  });
  res.json({ success: true, data: responses });
});

// GET /api/responses/collection-status - Collection open/closed
router.get('/collection-status', async (_req: AuthRequest, res: Response): Promise<void> => {
  const config = await prisma.collectionConfig.findUnique({ where: { id: 1 } });
  res.json({ success: true, data: { isOpen: config?.isOpen ?? true } });
});

// PATCH /api/responses/collection-status - Admin toggle collection
router.patch('/collection-status', adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ isOpen: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Valeur isOpen (boolean) requise' });
    return;
  }

  const config = await prisma.collectionConfig.upsert({
    where: { id: 1 },
    update: { isOpen: parsed.data.isOpen },
    create: { id: 1, isOpen: parsed.data.isOpen },
  });

  res.json({ success: true, data: { isOpen: config.isOpen } });
});

export default router;
