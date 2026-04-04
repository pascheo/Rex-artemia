import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { generateReport } from '../services/docx';
import {
  computeAxeScores,
  computeQuestionScores,
  computeByDirection,
  qualitativeMention,
  avg,
  AXES_LABELS,
  QUESTION_LABELS,
} from '../services/stats';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware, adminMiddleware);

// GET /api/report/docx - Generate and download the Word report
router.get('/docx', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [responses, config, totalUsers] = await Promise.all([
    prisma.response.findMany({
      include: { user: { select: { nom: true, email: true, direction: true } } },
      orderBy: { submittedAt: 'asc' },
    }),
    prisma.collectionConfig.findUnique({ where: { id: 1 } }),
    prisma.user.count({ where: { role: 'USER', isActive: true } }),
  ]);

  const respondentCount = responses.length;
  const participationRate = totalUsers > 0 ? Math.round((respondentCount / totalUsers) * 100) : 0;

  const allScores: number[] = [];
  for (const r of responses) {
    const sc = r.scores as Record<string, number>;
    allScores.push(...Object.values(sc).filter((v) => typeof v === 'number'));
  }
  const globalScore = avg(allScores);

  const axeScores = computeAxeScores(responses);
  const questionScores = computeQuestionScores(responses);
  const byDirection = computeByDirection(responses);

  const axeDetails = Object.entries(axeScores).map(([axe, score]) => ({
    axe,
    label: AXES_LABELS[axe] ?? axe,
    score,
    mention: qualitativeMention(score),
  }));

  const questionDetails = Object.entries(questionScores).map(([q, score]) => ({
    question: q,
    label: QUESTION_LABELS[q as keyof typeof QUESTION_LABELS] ?? q,
    score,
  }));

  const directions = [...new Set(responses.map((r) => r.user.direction))];

  const verbatim = {
    G1: responses.filter((r) => r.openG1).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG1 })),
    G2: responses.filter((r) => r.openG2).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG2 })),
    G3: responses.filter((r) => r.openG3).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG3 })),
    G4: responses.filter((r) => r.openG4).map((r) => ({ nom: r.user.nom, direction: r.user.direction, text: r.openG4 })),
  };

  try {
    const buffer = await generateReport({
      kpis: { totalUsers, respondentCount, participationRate, globalScore, collectionOpen: config?.isOpen ?? true },
      axeDetails,
      questionDetails,
      byDirection,
      verbatim,
      directions,
    });

    const now = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-poc-artemia-${now}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('DOCX generation error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération du rapport' });
  }
});

// GET /api/report/csv - Export all responses as CSV
router.get('/csv', async (_req: AuthRequest, res: Response): Promise<void> => {
  const responses = await prisma.response.findMany({
    include: { user: { select: { nom: true, email: true, direction: true } } },
    orderBy: { submittedAt: 'asc' },
  });

  const scoreKeys = ['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3','D4','D5','D6','E1','E2','F1','F2','F3'];

  const headers = ['ID', 'Nom', 'Email', 'Direction', 'Cas d\'usage', ...scoreKeys, 'G1', 'G2', 'G3', 'G4', 'Date soumission'];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = responses.map((r) => {
    const sc = r.scores as Record<string, number>;
    return [
      r.id,
      r.user.nom,
      r.user.email,
      r.user.direction,
      r.casUsage,
      ...scoreKeys.map((k) => sc[k] ?? ''),
      r.openG1 ?? '',
      r.openG2 ?? '',
      r.openG3 ?? '',
      r.openG4 ?? '',
      r.submittedAt.toISOString(),
    ].map(escapeCsv).join(',');
  });

  const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n');
  const now = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="export-poc-artemia-${now}.csv"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
});

export default router;
