import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware, adminMiddleware);

async function logAudit(adminId: string, action: string, details?: object) {
  await prisma.auditLog.create({
    data: { userId: adminId, action, details: details ?? {} },
  });
}

const createUserSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(1),
  direction: z.string().min(1),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional().default(Role.USER),
});

const updateUserSchema = z.object({
  nom: z.string().min(1).optional(),
  direction: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users - List all users with response status
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      direction: true,
      role: true,
      isActive: true,
      createdAt: true,
      responses: { select: { submittedAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const data = users.map((u) => ({
    ...u,
    hasResponded: u.responses.length > 0,
    respondedAt: u.responses[0]?.submittedAt ?? null,
    responses: undefined,
  }));

  res.json({ success: true, data });
});

// POST /api/admin/users - Create user
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, nom, direction, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Un compte avec cet email existe déjà' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, nom, direction, password: hash, role },
    select: { id: true, email: true, nom: true, direction: true, role: true, isActive: true },
  });

  await logAudit(req.user!.userId, 'CREATE_USER', { targetEmail: email });
  res.status(201).json({ success: true, data: user });
});

// PATCH /api/admin/users/:id - Update user
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.params['id'] },
    data: parsed.data,
    select: { id: true, email: true, nom: true, direction: true, role: true, isActive: true },
  });

  await logAudit(req.user!.userId, 'UPDATE_USER', { targetId: req.params['id'], changes: parsed.data });
  res.json({ success: true, data: user });
});

// POST /api/admin/users/:id/reset-password - Reset password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Mot de passe trop court (min 6 caractères)' });
    return;
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { id: req.params['id'] }, data: { password: hash } });

  await logAudit(req.user!.userId, 'RESET_PASSWORD', { targetId: req.params['id'] });
  res.json({ success: true, data: { message: 'Mot de passe réinitialisé' } });
});

// DELETE /api/admin/users/:id - Deactivate user
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.user.update({ where: { id: req.params['id'] }, data: { isActive: false } });
  await logAudit(req.user!.userId, 'DEACTIVATE_USER', { targetId: req.params['id'] });
  res.json({ success: true, data: { message: 'Compte désactivé' } });
});

export default router;
