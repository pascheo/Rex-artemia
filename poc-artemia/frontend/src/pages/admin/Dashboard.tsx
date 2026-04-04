import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import RadarChart from '../../components/RadarChart';
import BarChart from '../../components/BarChart';
import VerbatimList from '../../components/VerbatimList';

interface DashboardData {
  kpis: {
    totalUsers: number;
    respondentCount: number;
    participationRate: number;
    globalScore: number;
    globalMention: string;
    collectionOpen: boolean;
  };
  axeDetails: { axe: string; label: string; score: number; mention: string }[];
  questionDetails: { question: string; label: string; score: number }[];
  byDirection: Record<string, Record<string, number>>;
  timeline: { date: string; count: number }[];
  verbatim: {
    G1: { nom: string; direction: string; text: string | null }[];
    G2: { nom: string; direction: string; text: string | null }[];
    G3: { nom: string; direction: string; text: string | null }[];
    G4: { nom: string; direction: string; text: string | null }[];
  };
}

const mentionColor: Record<string, string> = {
  'Bon': '#1d4ed8',
  'Acceptable': '#065f46',
  'Insuffisant': '#92400e',
  'Très insuffisant': '#991b1b',
};

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: '1 1 160px' }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e' }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<DashboardData>('/admin/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleCollection = async () => {
    if (!data) return;
    setToggleLoading(true);
    try {
      await api.patch('/responses/collection-status', { isOpen: !data.kpis.collectionOpen });
      load();
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Chargement du tableau de bord...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Erreur de chargement.</div>;

  const directionBarData = Object.entries(data.byDirection).map(([dir, scores]) => ({
    name: dir.split(' — ')[0] ?? dir,
    ...scores,
  }));

  return (
    <div style={{ padding: '32px 20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e' }}>Tableau de bord — POC MIA Artemia</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Données consolidées en temps réel</p>
          </div>
          <button
            onClick={toggleCollection}
            disabled={toggleLoading}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: data.kpis.collectionOpen ? '#ef4444' : '#10b981',
              color: '#fff', fontWeight: 600, fontSize: '13px',
              cursor: toggleLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {data.kpis.collectionOpen ? 'Clôturer la collecte' : 'Rouvrir la collecte'}
          </button>
        </div>

        {/* Status banner */}
        <div style={{
          background: data.kpis.collectionOpen ? '#dcfce7' : '#fef3c7',
          border: `1px solid ${data.kpis.collectionOpen ? '#86efac' : '#fbbf24'}`,
          borderRadius: '8px', padding: '10px 16px', marginBottom: '24px',
          fontSize: '13px', color: data.kpis.collectionOpen ? '#166534' : '#92400e',
        }}>
          {data.kpis.collectionOpen ? '✅ Collecte ouverte — Les agents peuvent soumettre et modifier leurs réponses.' : '🔒 Collecte clôturée — Les agents ne peuvent plus modifier leurs réponses.'}
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <KpiCard label="Répondants" value={data.kpis.respondentCount} sub={`sur ${data.kpis.totalUsers} invités`} />
          <KpiCard label="Participation" value={`${data.kpis.participationRate}%`} />
          <KpiCard label="Note globale" value={`${data.kpis.globalScore}/4`} sub={data.kpis.globalMention} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Radar */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Scores par axe (radar)</h2>
            <RadarChart data={data.axeDetails} />
          </div>

          {/* Axe scores */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Détail par axe</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.axeDetails.map((a) => (
                <div key={a.axe}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#374151' }}><strong>Axe {a.axe}</strong> — {a.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: mentionColor[a.mention] ?? '#374151' }}>
                      {a.score}/4 — {a.mention}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(a.score / 4) * 100}%`, background: mentionColor[a.mention] ?? '#3b82f6', borderRadius: '99px', transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By direction chart */}
        {directionBarData.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Scores par direction</h2>
            <BarChart
              data={directionBarData}
              keys={['A', 'B', 'C', 'D', 'E', 'F']}
              xKey="name"
            />
          </div>
        )}

        {/* Questions detail */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1a1a2e' }}>Scores par question</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
            {data.questionDetails.map((q) => (
              <div key={q.question} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginRight: '6px' }}>{q.question}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{q.label}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E4057', flexShrink: 0, marginLeft: '8px' }}>{q.score}/4</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verbatim */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: '#1a1a2e' }}>Verbatim — Retours qualitatifs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <VerbatimList items={data.verbatim.G1.map((v) => ({ ...v, text: v.text ?? '' }))} title="G1 — Ce qui a convaincu" />
            <VerbatimList items={data.verbatim.G2.map((v) => ({ ...v, text: v.text ?? '' }))} title="G2 — Freins identifiés" />
            <VerbatimList items={data.verbatim.G3.map((v) => ({ ...v, text: v.text ?? '' }))} title="G3 — Incidents / hallucinations" />
            <VerbatimList items={data.verbatim.G4.map((v) => ({ ...v, text: v.text ?? '' }))} title="G4 — Recommandations" />
          </div>
        </div>
      </div>
    </div>
  );
}
