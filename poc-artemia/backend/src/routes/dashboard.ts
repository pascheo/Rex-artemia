import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import {
  computeAxeScores,
  computeQuestionScores,
  computeByDirection,
  computeTimeline,
  qualitativeMention,
  avg,
  AXES_LABELS,
  QUESTION_LABELS,
} from '../services/stats';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware, adminMiddleware);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [totalUsers, responses, config] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', isActive: true } }),
    prisma.response.findMany({
      include: { user: { select: { nom: true, email: true, direction: true } } },
      orderBy: { submittedAt: 'asc' },
    }),
    prisma.collectionConfig.findUnique({ where: { id: 1 } }),
  ]);

  const respondentCount = responses.length;
  const participationRate = totalUsers > 0 ? Math.round((respondentCount / totalUsers) * 100) : 0;

  // Global average across all questions
  const allScores: number[] = [];
  for (const r of responses) {
    const sc = r.scores as Record<string, number>;
    allScores.push(...Object.values(sc).filter((v) => typeof v === 'number'));
  }
  const globalScore = avg(allScores);

  const axeScores = computeAxeScores(responses);
  const questionScores = computeQuestionScores(responses);
  const byDirection = computeByDirection(responses);
  const timeline = computeTimeline(responses);

  const axeDetails = Object.entries(axeScores).map(([axe, score]) => ({
    axe,
    label: AXES_LABELS[axe],
    score,
    mention: qualitativeMention(score),
  }));

  const questionDetails = Object.entries(questionScores).map(([q, score]) => ({
    question: q,
    label: QUESTION_LABELS[q as keyof typeof QUESTION_LABELS],
    score,
  }));

  const verbatim = {
    G1: responses.filter((r) => r.openG1).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG1 })),
    G2: responses.filter((r) => r.openG2).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG2 })),
    G3: responses.filter((r) => r.openG3).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG3 })),
    G4: responses.filter((r) => r.openG4).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG4 })),
  };

  res.json({
    success: true,
    data: {
      kpis: {
        totalUsers,
        respondentCount,
        participationRate,
        globalScore,
        globalMention: qualitativeMention(globalScore),
        collectionOpen: config?.isOpen ?? true,
      },
      axeDetails,
      questionDetails,
      byDirection,
      timeline,
      verbatim,
    },
  });
});

export default router;
