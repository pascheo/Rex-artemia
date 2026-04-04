import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Response {
  id: string;
  casUsage: string;
  scores: Record<string, number>;
  submittedAt: string;
  user: { nom: string; email: string; direction: string };
}

const SCORE_KEYS = ['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3','D4','D5','D6','E1','E2','F1','F2','F3'];

function axeAvg(scores: Record<string, number>, keys: string[]): number {
  const vals = keys.map((k) => scores[k]).filter((v): v is number => typeof v === 'number');
  return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
}

const AXES: Record<string, string[]> = { A: ['A1','A2','A3'], B: ['B1','B2','B3'], C: ['C1','C2','C3'], D: ['D1','D2','D3','D4','D5','D6'], E: ['E1','E2'], F: ['F1','F2','F3'] };

export default function Responses() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get<Response[]>('/responses').then(setResponses).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>;

  return (
    <div style={{ padding: '32px 20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Toutes les réponses</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>{responses.length} réponse(s) soumise(s)</p>

        {responses.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Aucune réponse soumise pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {responses.map((r) => (
              <div key={r.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e' }}>{r.user.nom}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{r.user.direction} · {r.user.email}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontStyle: 'italic' }}>"{r.casUsage.slice(0, 80)}..."</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {Object.entries(AXES).map(([axe, keys]) => (
                      <span key={axe} style={{ fontSize: '11px', fontWeight: 700, background: '#f3f4f6', borderRadius: '6px', padding: '3px 7px', color: '#374151' }}>
                        {axe}: {axeAvg(r.scores, keys)}
                      </span>
                    ))}
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                      {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span style={{ fontSize: '16px', color: '#9ca3af' }}>{expanded === r.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === r.id && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', marginBottom: '16px' }}>
                      {SCORE_KEYS.map((k) => (
                        <div key={k} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: '6px', padding: '6px' }}>
                          <p style={{ fontSize: '10px', color: '#9ca3af' }}>{k}</p>
                          <p style={{ fontSize: '16px', fontWeight: 700, color: '#2E4057' }}>{r.scores[k] ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
