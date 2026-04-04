export interface Scores {
  A1: number; A2: number; A3: number;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
  D1: number; D2: number; D3: number; D4: number; D5: number; D6: number;
  E1: number; E2: number;
  F1: number; F2: number; F3: number;
}

export const AXES: Record<string, (keyof Scores)[]> = {
  A: ['A1', 'A2', 'A3'],
  B: ['B1', 'B2', 'B3'],
  C: ['C1', 'C2', 'C3'],
  D: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
  E: ['E1', 'E2'],
  F: ['F1', 'F2', 'F3'],
};

export const AXES_LABELS: Record<string, string> = {
  A: 'Pertinence des cas d\'usage',
  B: 'Facilité d\'utilisation (UX)',
  C: 'Qualité des résultats',
  D: 'Fonctionnalités avancées',
  E: 'Sécurité & Conformité',
  F: 'Intégration & Adoption',
};

export const QUESTION_LABELS: Record<keyof Scores, string> = {
  A1: 'Adéquation au besoin métier',
  A2: 'Richesse fonctionnelle',
  A3: 'Valeur ajoutée perçue',
  B1: 'Prise en main',
  B2: 'Ergonomie de l\'interface',
  B3: 'Rapidité des réponses',
  C1: 'Précision des réponses',
  C2: 'Pertinence des suggestions',
  C3: 'Gestion des cas limites',
  D1: 'Import fichiers — prise en main',
  D2: 'Import fichiers — exploitation',
  D3: 'Import fichiers — limitations',
  D4: 'Assistants — configuration',
  D5: 'Assistants — partage',
  D6: 'Assistants — cohérence',
  E1: 'Confidentialité des données',
  E2: 'Conformité RGPD perçue',
  F1: 'Intégration aux outils existants',
  F2: 'Potentiel d\'adoption dans l\'équipe',
  F3: 'Formation nécessaire',
};

export function qualitativeMention(score: number): string {
  if (score >= 3.5) return 'Bon';
  if (score >= 2.5) return 'Acceptable';
  if (score >= 1.5) return 'Insuffisant';
  return 'Très insuffisant';
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
}

export function computeAxeScores(responses: { scores: unknown }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [axe, keys] of Object.entries(AXES)) {
    const values: number[] = [];
    for (const r of responses) {
      const sc = r.scores as Record<string, number>;
      for (const k of keys) {
        if (typeof sc[k] === 'number') values.push(sc[k]);
      }
    }
    result[axe] = avg(values);
  }
  return result;
}

export function computeQuestionScores(responses: { scores: unknown }[]): Record<string, number> {
  const result: Record<string, number> = {};
  const allKeys = Object.keys(QUESTION_LABELS) as (keyof Scores)[];
  for (const key of allKeys) {
    const values: number[] = responses
      .map((r) => (r.scores as Record<string, number>)[key])
      .filter((v): v is number => typeof v === 'number');
    result[key] = avg(values);
  }
  return result;
}

export function computeByDirection(
  responses: { scores: unknown; user: { direction: string } }[]
): Record<string, Record<string, number>> {
  const byDir: Record<string, typeof responses> = {};
  for (const r of responses) {
    const dir = r.user.direction;
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(r);
  }
  const result: Record<string, Record<string, number>> = {};
  for (const [dir, reps] of Object.entries(byDir)) {
    result[dir] = computeAxeScores(reps);
  }
  return result;
}

export function computeTimeline(
  responses: { submittedAt: Date }[]
): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const d = r.submittedAt.toISOString().slice(0, 10);
    counts[d] = (counts[d] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}
