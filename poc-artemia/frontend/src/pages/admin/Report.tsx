import { useState } from 'react';
import { downloadFile } from '../../api/client';

export default function Report() {
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDocx = async () => {
    setLoadingDocx(true);
    setError('');
    setSuccess('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadFile('/report/docx', `rapport-poc-artemia-${date}.docx`);
      setSuccess('Rapport DOCX téléchargé avec succès.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération');
    } finally {
      setLoadingDocx(false);
    }
  };

  const handleCsv = async () => {
    setLoadingCsv(true);
    setError('');
    setSuccess('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadFile('/report/csv', `export-poc-artemia-${date}.csv`);
      setSuccess('Export CSV téléchargé avec succès.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'export');
    } finally {
      setLoadingCsv(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  return (
    <div style={{ padding: '32px 20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Génération de rapports</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Téléchargez le rapport Word complet ou l'export brut CSV.</p>

        {success && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#166534' }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* DOCX */}
          <div style={cardStyle}>
            <div style={{ width: '48px', height: '48px', background: '#dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📄
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>Rapport DOCX complet</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                Document Word structuré comprenant : page de garde, contexte, méthodologie, résultats quantitatifs, analyse qualitative, recommandation IA (Claude), et plan d'action.
              </p>
            </div>
            <ul style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '16px', lineHeight: '1.8' }}>
              <li>Scores par axe et par question</li>
              <li>Tableau de comparaison par direction</li>
              <li>Verbatim représentatifs</li>
              <li>Analyse et recommandation générées par IA</li>
            </ul>
            <button
              onClick={handleDocx}
              disabled={loadingDocx}
              style={{
                padding: '12px',
                background: loadingDocx ? '#9ca3af' : 'linear-gradient(135deg, #2E4057, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loadingDocx ? 'not-allowed' : 'pointer',
                marginTop: 'auto',
              }}
            >
              {loadingDocx ? '⏳ Génération en cours...' : '⬇ Télécharger le rapport DOCX'}
            </button>
            {loadingDocx && (
              <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                L'analyse IA peut prendre 10-30 secondes si la clé API est configurée.
              </p>
            )}
          </div>

          {/* CSV */}
          <div style={cardStyle}>
            <div style={{ width: '48px', height: '48px', background: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📊
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>Export brut CSV</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                Export tabulaire de toutes les réponses brutes : une ligne par répondant, toutes les colonnes (scores A1-F3, verbatim G1-G4, métadonnées).
              </p>
            </div>
            <ul style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '16px', lineHeight: '1.8' }}>
              <li>Compatible Excel (encodage UTF-8 BOM)</li>
              <li>Toutes les réponses individuelles</li>
              <li>Scores bruts + verbatim complets</li>
              <li>Exploitable dans tout outil BI</li>
            </ul>
            <button
              onClick={handleCsv}
              disabled={loadingCsv}
              style={{
                padding: '12px',
                background: loadingCsv ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loadingCsv ? 'not-allowed' : 'pointer',
                marginTop: 'auto',
              }}
            >
              {loadingCsv ? '⏳ Export en cours...' : '⬇ Télécharger le CSV'}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '12px', padding: '16px 20px', marginTop: '24px' }}>
          <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, marginBottom: '4px' }}>Configuration de l'analyse IA</p>
          <p style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6' }}>
            La section "Analyse et recommandation DSI" du rapport DOCX est générée automatiquement via l'API Claude (Anthropic).
            Si la variable <code>ANTHROPIC_API_KEY</code> n'est pas configurée dans le fichier <code>.env</code>, cette section contiendra un placeholder à compléter manuellement.
          </p>
        </div>
      </div>
    </div>
  );
}
