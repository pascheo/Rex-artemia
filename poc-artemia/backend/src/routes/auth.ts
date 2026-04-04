import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../auth/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        direction: user.direction,
        role: user.role,
      },
    },
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, nom: true, direction: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ success: false, error: 'Compte introuvable ou désactivé' });
    return;
  }

  res.json({ success: true, data: user });
});

export default router;
