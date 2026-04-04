import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, Header, Footer, PageNumber,
  NumberFormat, convertInchesToTwip,
} from 'docx';
import { qualitativeMention, AXES_LABELS, QUESTION_LABELS } from './stats';
import { generateClaudeAnalysis } from './claude';

interface ReportData {
  kpis: {
    totalUsers: number;
    respondentCount: number;
    participationRate: number;
    globalScore: number;
    collectionOpen: boolean;
  };
  axeDetails: { axe: string; label: string; score: number; mention: string }[];
  questionDetails: { question: string; label: string; score: number }[];
  byDirection: Record<string, Record<string, number>>;
  verbatim: {
    G1: { nom: string; direction: string; text: string | null }[];
    G2: { nom: string; direction: string; text: string | null }[];
    G3: { nom: string; direction: string; text: string | null }[];
    G4: { nom: string; direction: string; text: string | null }[];
  };
  directions: string[];
}

function h1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function para(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 22 })],
    spacing: { after: 120 },
  });
}

function tableHeader(texts: string[]): TableRow {
  return new TableRow({
    children: texts.map(
      (t) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', size: 20 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { type: ShadingType.CLEAR, fill: '2E4057' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        })
    ),
  });
}

function tableRow(cells: string[], shade = false): TableRow {
  return new TableRow({
    children: cells.map(
      (t, i) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: t, size: 20 })],
              alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            }),
          ],
          shading: shade ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined,
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        })
    ),
  });
}

function mentionColor(mention: string): string {
  if (mention === 'Bon') return '27AE60';
  if (mention === 'Acceptable') return 'F39C12';
  if (mention === 'Insuffisant') return 'E67E22';
  return 'C0392B';
}

function scoreBar(score: number): string {
  const filled = Math.round(score);
  return '█'.repeat(filled) + '░'.repeat(4 - filled) + ` (${score}/4)`;
}

export async function generateReport(data: ReportData): Promise<Buffer> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const claudeInput = {
    globalScore: data.kpis.globalScore,
    axeScores: Object.fromEntries(data.axeDetails.map((a) => [a.axe, a.score])),
    respondentCount: data.kpis.respondentCount,
    participationRate: data.kpis.participationRate,
    verbatimG1: data.verbatim.G1.map((v) => v.text ?? '').filter(Boolean),
    verbatimG2: data.verbatim.G2.map((v) => v.text ?? '').filter(Boolean),
    verbatimG3: data.verbatim.G3.map((v) => v.text ?? '').filter(Boolean),
    verbatimG4: data.verbatim.G4.map((v) => v.text ?? '').filter(Boolean),
  };

  const claudeAnalysis = await generateClaudeAnalysis(claudeInput);

  const children: Paragraph[] = [];

  // ── PAGE DE GARDE ──────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '', break: 8 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'CONSEIL DÉPARTEMENTAL DES YVELINES', bold: true, size: 28, color: '2E4057' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Direction des Systèmes d\'Information', size: 24, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'RAPPORT D\'ÉVALUATION', bold: true, size: 40, color: '1A1A2E' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'POC MIA Artemia', bold: true, size: 36, color: '2E4057' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Date : ${dateStr}`, size: 22 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Destinataire : Direction Générale', size: 22 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Classification : Diffusion restreinte', size: 22, color: 'C0392B', bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
  );

  // ── 1. CONTEXTE ET PÉRIMÈTRE ───────────────────────────────────────────────
  children.push(
    h1('1. Contexte et périmètre'),
    para('Dans le cadre de sa démarche de modernisation des outils métiers, la Direction des Systèmes d\'Information du Conseil Départemental des Yvelines a conduit un POC (Proof of Concept) de la solution d\'intelligence artificielle MIA Artemia, basée sur la technologie Claude d\'Anthropic.'),
    para(`Ce rapport consolide les retours des agents participants :`),
    para(`• Nombre de répondants : ${data.kpis.respondentCount} agent(s)`),
    para(`• Nombre d'agents invités : ${data.kpis.totalUsers}`),
    para(`• Taux de participation : ${data.kpis.participationRate} %`),
    para(`• Directions participantes : ${data.directions.length > 0 ? data.directions.join(', ') : 'N/A'}`),
    para(`• Date de génération du rapport : ${dateStr}`),
    para('La solution évaluée est MIA Artemia, un assistant IA conversationnel permettant l\'analyse documentaire, la rédaction assistée, la gestion d\'assistants personnalisés et l\'import de fichiers bureautiques.'),
  );

  // ── 2. MÉTHODOLOGIE ────────────────────────────────────────────────────────
  children.push(
    h1('2. Méthodologie'),
    para('Le questionnaire d\'évaluation couvre 6 axes thématiques, notés sur une échelle de 1 à 4 :'),
  );

  for (const [axe, label] of Object.entries(AXES_LABELS)) {
    children.push(para(`• Axe ${axe} — ${label}`));
  }

  children.push(
    para(''),
    para('Grille de notation :'),
    para('  1 — Très insuffisant  |  2 — Insuffisant  |  3 — Acceptable  |  4 — Bon'),
    para(''),
    para(`Le questionnaire comporte 20 questions notées (axes A à F) et 4 questions ouvertes (G1 à G4) permettant de recueillir les retours qualitatifs des utilisateurs.`),
  );

  // ── 3. RÉSULTATS QUANTITATIFS ──────────────────────────────────────────────
  children.push(h1('3. Résultats quantitatifs'));

  children.push(
    h2('3.1 Note globale'),
    para(`Note globale : ${data.kpis.globalScore}/4 — ${qualitativeMention(data.kpis.globalScore)}`),
    para(`Cette note représente la moyenne de l'ensemble des ${data.kpis.respondentCount} réponse(s) collectées, sur les 20 critères évalués.`),
  );

  // Axe scores table
  children.push(h2('3.2 Scores par axe'));

  const axeTableRows = [
    tableHeader(['Axe', 'Thématique', 'Score moyen', 'Mention']),
    ...data.axeDetails.map((a, i) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Axe ${a.axe}`, bold: true, size: 20 })] })],
            shading: i % 2 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: a.label, size: 20 })] })],
            shading: i % 2 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: scoreBar(a.score), size: 20 })] })],
            shading: i % 2 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: a.mention, bold: true, size: 20, color: mentionColor(a.mention) })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: i % 2 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          }),
        ],
      })
    ),
  ];

  children.push(
    new Paragraph({ children: [] }),
    // @ts-expect-error docx Table requires specific structure
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: axeTableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideH: { style: BorderStyle.SINGLE, size: 1 },
        insideV: { style: BorderStyle.SINGLE, size: 1 },
      },
    }),
    new Paragraph({ children: [], spacing: { after: 200 } }),
  );

  // Question detail table
  children.push(h2('3.3 Détail par question'));

  const qRows = [
    tableHeader(['Question', 'Intitulé', 'Score']),
    ...data.questionDetails.map((q, i) =>
      tableRow([q.question, q.label, `${q.score}/4`], i % 2 === 1)
    ),
  ];

  children.push(
    new Paragraph({ children: [] }),
    // @ts-expect-error docx Table requires specific structure
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: qRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideH: { style: BorderStyle.SINGLE, size: 1 },
        insideV: { style: BorderStyle.SINGLE, size: 1 },
      },
    }),
    new Paragraph({ children: [], spacing: { after: 200 } }),
  );

  // By direction table
  if (data.directions.length > 0) {
    children.push(h2('3.4 Scores par direction'));

    const axes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const dirRows = [
      tableHeader(['Direction', ...axes.map((a) => `Axe ${a}`)]),
      ...data.directions.map((dir, i) => {
        const scores = data.byDirection[dir] ?? {};
        return tableRow(
          [dir, ...axes.map((a) => (scores[a] !== undefined ? `${scores[a]}/4` : '-'))],
          i % 2 === 1
        );
      }),
    ];

    children.push(
      new Paragraph({ children: [] }),
      // @ts-expect-error docx Table requires specific structure
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: dirRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideH: { style: BorderStyle.SINGLE, size: 1 },
          insideV: { style: BorderStyle.SINGLE, size: 1 },
        },
      }),
      new Paragraph({ children: [], spacing: { after: 200 } }),
    );
  }

  // ── 4. ANALYSE QUALITATIVE ─────────────────────────────────────────────────
  children.push(h1('4. Analyse qualitative — Verbatim'));

  const verbatimSections: { label: string; key: keyof typeof data.verbatim; desc: string }[] = [
    { label: 'G1 — Points forts', key: 'G1', desc: 'Ce qui a le plus convaincu les utilisateurs :' },
    { label: 'G2 — Freins identifiés', key: 'G2', desc: 'Principaux obstacles ou freins à l\'adoption :' },
    { label: 'G3 — Incidents et hallucinations', key: 'G3', desc: 'Erreurs, hallucinations ou résultats inappropriés rencontrés :' },
    { label: 'G4 — Recommandations', key: 'G4', desc: 'Recommandations des utilisateurs sur le déploiement :' },
  ];

  for (const section of verbatimSections) {
    children.push(h2(section.label), para(section.desc));
    const items = data.verbatim[section.key];
    if (items.length === 0) {
      children.push(para('Aucun verbatim disponible.'));
    } else {
      for (const item of items) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `"${item.text}"`, italics: true, size: 20 }),
              new TextRun({ text: `  — ${item.nom} (${item.direction})`, size: 18, color: '666666' }),
            ],
            spacing: { after: 120 },
            indent: { left: convertInchesToTwip(0.3) },
          })
        );
      }
    }
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
  }

  // ── 5. ANALYSE DSI (CLAUDE) ────────────────────────────────────────────────
  children.push(
    h1('5. Analyse et recommandation DSI'),
    para('Cette section a été générée automatiquement par intelligence artificielle sur la base des données consolidées du POC.', true),
    para(''),
  );

  const analysisLines = claudeAnalysis.split('\n');
  for (const line of analysisLines) {
    children.push(para(line));
  }

  // ── 6. PROCHAINES ÉTAPES ───────────────────────────────────────────────────
  children.push(
    h1('6. Prochaines étapes'),
    h2('Actions recommandées'),
  );

  const actions = [
    ['Présentation des résultats', 'Organiser une réunion de restitution avec les directions participantes et la Direction Générale', 'DSI + DG', 'J+15'],
    ['Charte d\'utilisation', 'Rédiger et valider une charte d\'utilisation de l\'IA au sein du CD78 (données sensibles, RGPD)', 'DSI + DPO + Juridique', 'J+30'],
    ['Formation des agents', 'Concevoir un module de formation (2h) sur les bonnes pratiques d\'usage de l\'IA générative', 'DSI + RH', 'J+45'],
    ['Déploiement pilote', 'Sélectionner 2-3 directions pilotes et déployer MIA Artemia en phase de production encadrée', 'DSI', 'J+60'],
    ['Bilan et décision', 'Évaluer les résultats du déploiement pilote et décider de la généralisation', 'DSI + DG', 'J+120'],
  ];

  const actionRows = [
    tableHeader(['Action', 'Description', 'Responsable', 'Échéance']),
    ...actions.map((a, i) => tableRow(a, i % 2 === 1)),
  ];

  children.push(
    new Paragraph({ children: [] }),
    // @ts-expect-error docx Table requires specific structure
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: actionRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideH: { style: BorderStyle.SINGLE, size: 1 },
        insideV: { style: BorderStyle.SINGLE, size: 1 },
      },
    }),
    new Paragraph({ children: [], spacing: { after: 300 } }),
  );

  // ── DOCUMENT ───────────────────────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: NumberFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
        }],
      }],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Conseil Départemental des Yvelines — POC MIA Artemia — ', size: 18, color: '666666' }),
                  new TextRun({ text: 'Usage interne — Diffusion restreinte', size: 18, color: '999999', italics: true }),
                ],
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E4057' } },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `DSI CD78 — Rapport généré le ${dateStr} — Page `, size: 18, color: '666666' }),
                  new PageNumber(),
                ],
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: '2E4057' } },
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
