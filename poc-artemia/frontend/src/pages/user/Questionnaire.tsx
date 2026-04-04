import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import ScoreSelector from '../../components/ScoreSelector';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';

type Scores = Record<string, number | null>;

interface ExistingResponse {
  casUsage: string;
  scores: Record<string, number>;
  openG1?: string;
  openG2?: string;
  openG3?: string;
  openG4?: string;
}

const AXES = [
  {
    label: 'A — Pertinence des cas d\'usage',
    questions: [
      { key: 'A1', text: 'La solution répond-elle au besoin identifié dans votre cas d\'usage ?' },
      { key: 'A2', text: 'Les fonctionnalités disponibles couvrent-elles l\'ensemble du périmètre attendu ?' },
      { key: 'A3', text: 'Estimez-vous que cette IA apporte un gain réel par rapport à votre façon de travailler actuelle ?' },
    ],
  },
  {
    label: 'B — Facilité d\'utilisation (UX)',
    questions: [
      { key: 'B1', text: 'Avez-vous pu utiliser la solution sans formation préalable approfondie ?' },
      { key: 'B2', text: 'L\'interface est-elle intuitive et agréable à utiliser ?' },
      { key: 'B3', text: 'Les délais de traitement sont-ils acceptables pour votre usage ?' },
    ],
  },
  {
    label: 'C — Qualité des résultats',
    questions: [
      { key: 'C1', text: 'Les réponses produites sont-elles exactes et fiables ?' },
      { key: 'C2', text: 'Les propositions faites par l\'IA sont-elles adaptées à votre contexte ?' },
      { key: 'C3', text: 'Comment la solution se comporte-t-elle sur des sujets complexes ou sensibles ?' },
    ],
  },
  {
    label: 'D — Fonctionnalités avancées (Fichiers & Assistants)',
    questions: [
      { key: 'D1', text: 'La prise en main de l\'import de fichiers vous a-t-elle semblé simple et intuitive ?' },
      { key: 'D2', text: 'La solution a-t-elle correctement analysé et exploité le contenu de vos fichiers ?' },
      { key: 'D3', text: 'Avez-vous rencontré des limitations (taille, format, fidélité d\'interprétation) ?' },
      { key: 'D4', text: 'La configuration d\'un assistant vous a-t-elle semblé accessible sans compétences techniques ?' },
      { key: 'D5', text: 'Avez-vous pu partager un assistant avec vos collègues facilement ?' },
      { key: 'D6', text: 'Les assistants créés ont-ils produit des résultats cohérents avec les instructions données ?' },
    ],
  },
  {
    label: 'E — Sécurité & Conformité',
    questions: [
      { key: 'E1', text: 'Avez-vous des inquiétudes sur la gestion de vos données par la solution ?' },
      { key: 'E2', text: 'La solution vous semble-t-elle respecter les exigences RGPD de votre direction ?' },
    ],
  },
  {
    label: 'F — Intégration & Adoption',
    questions: [
      { key: 'F1', text: 'La solution s\'intègre-t-elle bien avec vos outils actuels (M365, métier…) ?' },
      { key: 'F2', text: 'Vos collègues seraient-ils prêts à utiliser cette solution au quotidien ?' },
      { key: 'F3', text: 'Quel niveau de formation seriez-vous prêt à accepter pour déployer cette solution ?' },
    ],
  },
];

const TOTAL_STEPS = 9;

export default function Questionnaire() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [casUsage, setCasUsage] = useState('');
  const [scores, setScores] = useState<Scores>({});
  const [openG1, setOpenG1] = useState('');
  const [openG2, setOpenG2] = useState('');
  const [openG3, setOpenG3] = useState('');
  const [openG4, setOpenG4] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ExistingResponse | null>('/responses/my'),
      api.get<{ isOpen: boolean }>('/responses/collection-status'),
    ]).then(([existing, status]) => {
      setCollectionOpen(status.isOpen);
      if (existing) {
        setIsEdit(true);
        setCasUsage(existing.casUsage);
        setScores(existing.scores as Scores);
        setOpenG1(existing.openG1 ?? '');
        setOpenG2(existing.openG2 ?? '');
        setOpenG3(existing.openG3 ?? '');
        setOpenG4(existing.openG4 ?? '');
      }
    }).catch(console.error);
  }, []);

  const setScore = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 0) return casUsage.trim().length > 0;
    if (step >= 1 && step <= 6) {
      const axe = AXES[step - 1];
      return axe?.questions.every((q) => scores[q.key] !== undefined && scores[q.key] !== null) ?? false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    const allScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (v !== null) allScores[k] = v as number;
    }

    const payload = { casUsage, scores: allScores, openG1, openG2, openG3, openG4 };
    try {
      if (isEdit) {
        await api.put('/responses/my', payload);
      } else {
        await api.post('/responses', payload);
      }
      navigate('/ma-reponse');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la soumission');
    } finally {
      setSaving(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: '760px',
    margin: '0 auto',
  };

  if (!collectionOpen) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '12px', padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#92400e' }}>La collecte est actuellement clôturée.</p>
          <p style={{ fontSize: '14px', color: '#78350f', marginTop: '8px' }}>Vous ne pouvez plus modifier votre réponse. Contactez l'administrateur pour plus d'informations.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 20px', minHeight: '100vh', background: '#f4f6f9' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
          {isEdit ? 'Modifier ma réponse' : 'Questionnaire d\'évaluation'}
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          {user?.nom} — {user?.direction}
        </p>
      </div>

      <div style={cardStyle}>
        <ProgressBar current={step} total={TOTAL_STEPS - 1} label={
          step === 0 ? 'Étape 0 — Cas d\'usage' :
          step <= 6 ? `Étape ${step}/6 — Axe ${AXES[step - 1]?.label.split('—')[0].trim()}` :
          step === 7 ? 'Étape 7 — Questions ouvertes' :
          'Récapitulatif'
        } />

        {/* STEP 0 — Cas d'usage */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Quel cas d'usage avez-vous testé ?</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Décrivez brièvement la tâche ou l'activité que vous avez évaluée avec MIA Artemia.
            </p>
            <textarea
              value={casUsage}
              onChange={(e) => setCasUsage(e.target.value)}
              placeholder="Ex : Rédaction d'offres d'emploi, analyse de documents, synthèse de rapports..."
              style={{
                width: '100%', minHeight: '120px', padding: '12px',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                resize: 'vertical', outline: 'none',
              }}
            />
          </div>
        )}

        {/* STEPS 1–6 — Axes */}
        {step >= 1 && step <= 6 && (() => {
          const axe = AXES[step - 1];
          if (!axe) return null;
          return (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{axe.label}</h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px' }}>
                1 = Très insuffisant | 2 = Insuffisant | 3 = Acceptable | 4 = Bon
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {axe.questions.map((q) => (
                  <div key={q.key}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <span style={{
                        background: '#2E4057', color: '#fff', borderRadius: '6px',
                        padding: '2px 8px', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                      }}>{q.key}</span>
                      <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{q.text}</p>
                    </div>
                    <ScoreSelector
                      value={(scores[q.key] as number | null) ?? null}
                      onChange={(v) => setScore(q.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* STEP 7 — Verbatim */}
        {step === 7 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Questions ouvertes</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              Ces questions sont facultatives mais vos retours sont précieux pour la DSI.
            </p>
            {[
              { id: 'G1', label: 'Ce qui vous a le plus convaincu dans cette solution', state: openG1, set: setOpenG1 },
              { id: 'G2', label: 'Principaux obstacles ou freins à l\'adoption selon vous', state: openG2, set: setOpenG2 },
              { id: 'G3', label: 'Erreurs, hallucinations ou résultats inappropriés rencontrés', state: openG3, set: setOpenG3 },
              { id: 'G4', label: 'Recommanderiez-vous le déploiement ? Pourquoi ?', state: openG4, set: setOpenG4 },
            ].map((q) => (
              <div key={q.id} style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  <span style={{ background: '#f3f4f6', borderRadius: '4px', padding: '2px 6px', fontFamily: 'monospace', marginRight: '8px' }}>{q.id}</span>
                  {q.label}
                </label>
                <textarea
                  value={q.state}
                  onChange={(e) => q.set(e.target.value)}
                  placeholder="Votre réponse (facultatif)..."
                  style={{
                    width: '100%', minHeight: '100px', padding: '10px 12px',
                    border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
                    resize: 'vertical', outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 8 — Récapitulatif */}
        {step === 8 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Récapitulatif de vos réponses</h2>
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Cas d'usage testé :</p>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>{casUsage}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              {AXES.flatMap((axe) => axe.questions).map((q) => (
                <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#6b7280' }}>{q.key}</span>
                  <span style={{ fontWeight: 700, color: scores[q.key] === 4 ? '#1d4ed8' : scores[q.key] === 3 ? '#065f46' : scores[q.key] === 2 ? '#92400e' : '#991b1b' }}>
                    {scores[q.key] ?? '—'}/4
                  </span>
                </div>
              ))}
            </div>
            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              border: '1px solid #d1d5db', background: '#fff',
              fontSize: '14px', cursor: step === 0 ? 'not-allowed' : 'pointer',
              color: step === 0 ? '#9ca3af' : '#374151',
            }}
          >
            Précédent
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: canProceed() ? 'linear-gradient(135deg, #2E4057, #3b82f6)' : '#d1d5db',
                color: '#fff', border: 'none',
                fontSize: '14px', cursor: canProceed() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '10px 32px', borderRadius: '8px',
                background: saving ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none',
                fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {saving ? 'Envoi...' : isEdit ? 'Mettre à jour' : 'Soumettre ma réponse'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
