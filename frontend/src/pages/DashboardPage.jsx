import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const NOMS_AXES = { moy_a: 'A — Pertinence', moy_b: 'B — UX', moy_c: 'C — Qualité', moy_d: 'D — Avancé', moy_e: 'E — Sécurité', moy_f: 'F — Intégration' };
const AXES = ['moy_a', 'moy_b', 'moy_c', 'moy_d', 'moy_e', 'moy_f'];

function getToken() {
  return sessionStorage.getItem('dsi_token');
}

function headersAuth() {
  return { 'Authorization': `Bearer ${getToken()}` };
}

function couleurNote(note) {
  if (note === null || note === undefined) return '#cccccc';
  const n = parseFloat(note);
  if (n < 2) return '#dc3545';
  if (n <= 3) return '#fd7e14';
  return '#28a745';
}

function BadgeNote({ valeur }) {
  if (valeur === null || valeur === undefined || isNaN(parseFloat(valeur))) {
    return <span style={{ color: '#aaa', fontSize: '0.85rem' }}>—</span>;
  }
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: couleurNote(valeur),
      color: '#ffffff',
      padding: '3px 10px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.85rem',
      minWidth: '40px',
      textAlign: 'center',
    }}>
      {parseFloat(valeur).toFixed(1)}
    </span>
  );
}

function KPI({ titre, valeur, unite }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      textAlign: 'center',
      flex: 1,
      minWidth: '160px',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#003189' }}>{valeur ?? '—'}</div>
      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '6px' }}>{titre}</div>
      {unite && <div style={{ fontSize: '0.78rem', color: '#888' }}>{unite}</div>}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titre: { color: '#003189', margin: 0 },
  boutonDeconnexion: { backgroundColor: 'transparent', color: '#003189', border: '1px solid #003189', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  grillKpi: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' },
  section: { backgroundColor: '#ffffff', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  sectionEntete: { backgroundColor: '#003189', color: '#ffffff', padding: '14px 20px', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableauWrapper: { overflowX: 'auto' },
  tableau: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '10px 12px', backgroundColor: '#f0f4ff', color: '#003189', fontWeight: 600, border: '1px solid #dde3f0', textAlign: 'center', whiteSpace: 'nowrap' },
  thLeft: { padding: '10px 12px', backgroundColor: '#f0f4ff', color: '#003189', fontWeight: 600, border: '1px solid #dde3f0', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '8px 12px', border: '1px solid #e8ecf5', textAlign: 'center', verticalAlign: 'middle' },
  tdLeft: { padding: '8px 12px', border: '1px solid #e8ecf5', textAlign: 'left', verticalAlign: 'middle' },
  boutonExport: { backgroundColor: '#28a745', color: '#ffffff', border: 'none', padding: '10px 20px', fontSize: '0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  boutonSupprimer: { backgroundColor: '#dc3545', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' },
  accordeonBouton: { width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', fontSize: '0.9rem', borderBottom: '1px solid #e8ecf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  accordeonContenu: { padding: '16px 20px', borderBottom: '1px solid #e8ecf5', backgroundColor: '#fafbff' },
  verbatimQuestion: { fontWeight: 600, color: '#003189', marginBottom: '6px', fontSize: '0.85rem' },
  verbatimReponse: { color: '#333', fontSize: '0.88rem', marginBottom: '16px', whiteSpace: 'pre-wrap', borderLeft: '3px solid #003189', paddingLeft: '12px' },
  vide: { color: '#aaa', fontStyle: 'italic', fontSize: '0.85rem' },
  chargement: { textAlign: 'center', padding: '40px', color: '#555' },
};

const VERBATIM_LABELS = [
  { cle: 'g1_points_convaincants', label: 'Points convaincants' },
  { cle: 'g2_obstacles_adoption', label: "Obstacles à l'adoption" },
  { cle: 'g3_erreurs_hallucinations', label: 'Erreurs / hallucinations' },
  { cle: 'g4_recommandation_deploiement', label: 'Recommandation déploiement' },
  { cle: 'g5_autres_remarques', label: 'Autres remarques' },
];

export default function DashboardPage() {
  const [donnees, setDonnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [accordeonOuverts, setAccordeonOuverts] = useState({});
  const [idASupprimer, setIdASupprimer] = useState(null);
  const [suppressionErreur, setSuppressionErreur] = useState('');
  const navigate = useNavigate();

  function deconnecter() {
    sessionStorage.removeItem('dsi_token');
    navigate('/login');
  }

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await fetch(`${API_URL}/api/reponses/consolidation`, {
        headers: headersAuth(),
      });
      if (reponse.status === 401) { deconnecter(); return; }
      if (!reponse.ok) throw new Error('Erreur lors du chargement des données.');
      const json = await reponse.json();
      setDonnees(json);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  function toggleAccordeon(id) {
    setAccordeonOuverts((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function telechargerCSV() {
    const token = getToken();
    // Fetch avec auth puis déclenchement du téléchargement via blob
    fetch(`${API_URL}/api/reponses/export.csv`, { headers: headersAuth() })
      .then((r) => {
        if (r.status === 401) { deconnecter(); return null; }
        return r.blob();
      })
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export-artemia.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  function demanderSuppression(id) {
    setIdASupprimer(id);
    setSuppressionErreur('');
  }

  async function confirmerSuppression() {
    try {
      const reponse = await fetch(`${API_URL}/api/reponses/${idASupprimer}`, {
        method: 'DELETE',
        headers: headersAuth(),
      });
      if (reponse.status === 401) { deconnecter(); return; }
      const json = await reponse.json();
      if (reponse.ok) {
        setIdASupprimer(null);
        chargerDonnees();
      } else {
        setSuppressionErreur(json.erreur || 'Erreur lors de la suppression.');
      }
    } catch {
      setSuppressionErreur('Impossible de joindre le serveur.');
    }
  }

  // Calcul des KPIs
  const nbRepondants = donnees.length;
  const moyenneGlobale = nbRepondants > 0
    ? Math.round(donnees.reduce((s, r) => s + (parseFloat(r.moy_globale) || 0), 0) / nbRepondants * 10) / 10
    : null;
  const moyenneC = nbRepondants > 0
    ? Math.round(donnees.reduce((s, r) => s + (parseFloat(r.moy_c) || 0), 0) / nbRepondants * 10) / 10
    : null;

  let meilleurAxe = null;
  if (nbRepondants > 0) {
    let maxVal = -1;
    for (const axe of AXES) {
      const moy = donnees.reduce((s, r) => s + (parseFloat(r[axe]) || 0), 0) / nbRepondants;
      if (moy > maxVal) { maxVal = moy; meilleurAxe = NOMS_AXES[axe]; }
    }
  }

  if (chargement) return <div style={styles.chargement}>Chargement des données...</div>;
  if (erreur) return <div style={{ ...styles.chargement, color: '#dc3545' }}>Erreur : {erreur}</div>;

  return (
    <div style={styles.page}>
      <div style={styles.entete}>
        <h2 style={styles.titre}>Tableau de bord DSI — POC MIA Artemia</h2>
        <button style={styles.boutonDeconnexion} onClick={deconnecter}>Deconnexion</button>
      </div>

      {/* KPIs */}
      <div style={styles.grillKpi}>
        <KPI titre="Repondants" valeur={nbRepondants} />
        <KPI titre="Note qualite moyenne (section C)" valeur={moyenneC !== null ? moyenneC.toFixed(1) : null} unite="sur 4" />
        <KPI titre="Moyenne globale" valeur={moyenneGlobale !== null ? moyenneGlobale.toFixed(1) : null} unite="sur 4" />
        <KPI titre="Meilleur axe" valeur={meilleurAxe ?? '—'} />
      </div>

      {/* Tableau de consolidation */}
      <div style={styles.section}>
        <div style={styles.sectionEntete}>
          <span>Consolidation par repondant</span>
          <button style={styles.boutonExport} onClick={telechargerCSV}>
            Exporter CSV
          </button>
        </div>
        {nbRepondants === 0 ? (
          <p style={{ padding: '20px', color: '#555' }}>Aucune reponse enregistree pour le moment.</p>
        ) : (
          <div style={styles.tableauWrapper}>
            <table style={styles.tableau}>
              <thead>
                <tr>
                  <th style={styles.thLeft}>Direction</th>
                  <th style={styles.thLeft}>Nom</th>
                  <th style={styles.th}>Date</th>
                  {AXES.map((a) => (
                    <th key={a} style={styles.th}>{NOMS_AXES[a].split(' — ')[0]}</th>
                  ))}
                  <th style={styles.th}>Globale</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {donnees.map((r) => (
                  <tr key={r.id}>
                    <td style={styles.tdLeft}>{r.direction}</td>
                    <td style={styles.tdLeft}>{r.nom_prenom}</td>
                    <td style={styles.td}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    {AXES.map((a) => (
                      <td key={a} style={styles.td}><BadgeNote valeur={r[a]} /></td>
                    ))}
                    <td style={styles.td}><BadgeNote valeur={r.moy_globale} /></td>
                    <td style={styles.td}>
                      <button style={styles.boutonSupprimer} onClick={() => demanderSuppression(r.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verbatim */}
      <div style={styles.section}>
        <div style={styles.sectionEntete}>
          <span>Verbatim par repondant</span>
        </div>
        {nbRepondants === 0 ? (
          <p style={{ padding: '20px', color: '#555' }}>Aucune reponse disponible.</p>
        ) : (
          donnees.map((r) => (
            <div key={r.id}>
              <button
                style={styles.accordeonBouton}
                onClick={() => toggleAccordeon(r.id)}
                aria-expanded={!!accordeonOuverts[r.id]}
              >
                <span>
                  <strong>{r.nom_prenom}</strong>
                  <span style={{ color: '#555', marginLeft: '8px', fontSize: '0.85rem' }}>({r.direction})</span>
                </span>
                <span>{accordeonOuverts[r.id] ? '▲' : '▼'}</span>
              </button>
              {accordeonOuverts[r.id] && (
                <div style={styles.accordeonContenu}>
                  {VERBATIM_LABELS.map(({ cle, label }) => (
                    <div key={cle}>
                      <div style={styles.verbatimQuestion}>{label}</div>
                      {r[cle] ? (
                        <div style={styles.verbatimReponse}>{r[cle]}</div>
                      ) : (
                        <div style={{ ...styles.vide, marginBottom: '16px' }}>Non renseigne</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {idASupprimer !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#dc3545' }}>Confirmer la suppression</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>
              Cette action est irreversible. Etes-vous certain de vouloir supprimer cette reponse ?
            </p>
            {suppressionErreur && (
              <p style={{ color: '#dc3545', fontSize: '0.85rem', marginBottom: '12px' }}>{suppressionErreur}</p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIdASupprimer(null)}
                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmerSuppression}
                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: '#dc3545', color: '#fff', fontWeight: 600 }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
