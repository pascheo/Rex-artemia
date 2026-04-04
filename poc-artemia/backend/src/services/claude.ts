import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeAnalysisInput {
  globalScore: number;
  axeScores: Record<string, number>;
  respondentCount: number;
  participationRate: number;
  verbatimG1: string[];
  verbatimG2: string[];
  verbatimG3: string[];
  verbatimG4: string[];
}

export async function generateClaudeAnalysis(input: ClaudeAnalysisInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-...') {
    return '[ANALYSE IA NON DISPONIBLE — Veuillez configurer ANTHROPIC_API_KEY dans le fichier .env pour générer cette section automatiquement.]';
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5';

  const axeLines = Object.entries(input.axeScores)
    .map(([axe, score]) => `  - Axe ${axe} : ${score}/4`)
    .join('\n');

  const prompt = `Tu es expert en transformation numérique dans les collectivités territoriales françaises.
Tu dois rédiger une analyse professionnelle et une recommandation d'adoption pour la solution d'IA MIA Artemia (basée sur Claude d'Anthropic) dans le cadre d'un POC mené par la DSI du Conseil Départemental des Yvelines (CD78).

DONNÉES DU POC :
- Nombre de répondants : ${input.respondentCount}
- Taux de participation : ${input.participationRate}%
- Note globale : ${input.globalScore}/4
- Scores par axe :
${axeLines}

VERBATIM — POINTS FORTS (G1) :
${input.verbatimG1.map((v, i) => `${i + 1}. "${v}"`).join('\n') || 'Aucun verbatim disponible'}

VERBATIM — FREINS (G2) :
${input.verbatimG2.map((v, i) => `${i + 1}. "${v}"`).join('\n') || 'Aucun verbatim disponible'}

VERBATIM — INCIDENTS / HALLUCINATIONS (G3) :
${input.verbatimG3.map((v, i) => `${i + 1}. "${v}"`).join('\n') || 'Aucun verbatim disponible'}

VERBATIM — RECOMMANDATIONS (G4) :
${input.verbatimG4.map((v, i) => `${i + 1}. "${v}"`).join('\n') || 'Aucun verbatim disponible'}

Rédige une analyse structurée en 3 parties (environ 400-600 mots au total) :

1. SYNTHÈSE DES RÉSULTATS : analyse argumentée des scores et des retours utilisateurs, identification des points forts et des axes d'amélioration prioritaires

2. RECOMMANDATION : prononce une recommandation claire parmi les 3 options suivantes, et justifie-la :
   - ADOPTION RECOMMANDÉE : déploiement général conseillé
   - DÉPLOIEMENT CONDITIONNEL : déploiement limité à certains usages ou directions, avec conditions
   - REJET MOTIVÉ : déploiement déconseillé à ce stade, avec explication

3. PROCHAINES ÉTAPES PROPOSÉES : liste de 4-5 actions concrètes pour la DSI CD78

Style : professionnel, objectif, adapté à un rapport destiné à la Direction Générale d'une collectivité territoriale. Évite le jargon technique excessif. Sois direct et opérationnel.`;

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  return '[Erreur lors de la génération de l\'analyse IA]';
}
