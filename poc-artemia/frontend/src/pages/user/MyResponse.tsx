import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

interface Response {
  id: string;
  casUsage: string;
  scores: Record<string, number>;
  openG1?: string;
  openG2?: string;
  openG3?: string;
  openG4?: string;
  submittedAt: string;
  updatedAt: string;
}

const AXES: Record<string, string[]> = {
  A: ['A1', 'A2', 'A3'],
  B: ['B1', 'B2', 'B3'],
  C: ['C1', 'C2', 'C3'],
  D: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
  E: ['E1', 'E2'],
  F: ['F1', 'F2', 'F3'],
};

const AXES_LABELS: Record<string, string> = {
  A: 'Pertinence des cas d\'usage',
  B: 'Facilité d\'utilisation (UX)',
  C: 'Qualité des résultats',
  D: 'Fonctionnalités avancées',
  E: 'Sécurité & Conformité',
  F: 'Intégration & Adoption',
};

function avg(vals: number[]): number {
  return vals.length === 0 ? 0 : Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

function scoreColor(v: number) {
  if (v >= 3.5) return '#1d4ed8';
  if (v >= 2.5) return '#065f46';
  if (v >= 1.5) return '#92400e';
  return '#991b1b';
}

export default function MyResponse() {
  const [response, setResponse] = useState<Response | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get<Response | null>('/responses/my'),
      api.get<{ isOpen: boolean }>('/responses/collection-status'),
    ]).then(([r, s]) => {
      setResponse(r);
      setCollectionOpen(s.isOpen);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>;

  if (!response) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Vous n'avez pas encore soumis de réponse.</p>
        <button
          onClick={() => navigate('/questionnaire')}
          style={{ padding: '10px 24px', background: '#2E4057', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Commencer le questionnaire
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 20px', minHeight: '100vh', background: '#f4f6f9' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Ma réponse</h1>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              Soumise le {new Date(response.submittedAt).toLocaleDateString('fr-FR')}
              {response.updatedAt !== response.submittedAt && ` · Modifiée le ${new Date(response.updatedAt).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          {collectionOpen && (
            <button
              onClick={() => navigate('/questionnaire')}
              style={{ padding: '8px 20px', background: '#2E4057', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
            >
              Modifier ma réponse
            </button>
          )}
        </div>

        {/* Cas d'usage */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cas d'usage testé</p>
          <p style={{ fontSize: '14px', color: '#374151' }}>{response.casUsage}</p>
        </div>

        {/* Scores par axe */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Scores par axe</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(AXES).map(([axe, keys]) => {
              const vals = keys.map((k) => response.scores[k]).filter((v): v is number => typeof v === 'number');
              const mean = avg(vals);
              return (
                <div key={axe}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Axe {axe} — {AXES_LABELS[axe]}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(mean) }}>{mean}/4</span>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(mean / 4) * 100}%`, background: scoreColor(mean), borderRadius: '99px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {keys.map((k) => (
                      <span key={k} style={{ fontSize: '11px', background: '#f3f4f6', borderRadius: '4px', padding: '2px 6px', color: '#6b7280' }}>
                        {k}: <strong style={{ color: scoreColor(response.scores[k] ?? 0) }}>{response.scores[k] ?? '—'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verbatim */}
        {(response.openG1 || response.openG2 || response.openG3 || response.openG4) && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Vos retours qualitatifs</h2>
            {[
              { id: 'G1', label: 'Points forts', val: response.openG1 },
              { id: 'G2', label: 'Freins identifiés', val: response.openG2 },
              { id: 'G3', label: 'Incidents / hallucinations', val: response.openG3 },
              { id: 'G4', label: 'Recommandation', val: response.openG4 },
            ].filter((q) => q.val).map((q) => (
              <div key={q.id} style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>{q.id} — {q.label}</p>
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', borderLeft: '3px solid #2E4057', paddingLeft: '12px' }}>{q.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
