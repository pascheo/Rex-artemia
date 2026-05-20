import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Définition des sections et critères du questionnaire
const SECTIONS = [
  {
    id: 'A',
    titre: 'A. Pertinence des cas d\'usage',
    criteres: [
      { cle: 'a1_adequation', libelle: 'Adéquation au besoin métier', question: 'La solution répond-elle au besoin identifié dans votre cas d\'usage ?' },
      { cle: 'a2_richesse_fonctionnelle', libelle: 'Richesse fonctionnelle', question: 'Les fonctionnalités disponibles couvrent-elles l\'ensemble du périmètre attendu ?' },
      { cle: 'a3_valeur_ajoutee', libelle: 'Valeur ajoutée perçue', question: 'Estimez-vous que cette IA apporte un gain réel par rapport à votre façon de travailler actuelle ?' },
    ],
  },
  {
    id: 'B',
    titre: 'B. Facilité d\'utilisation (UX)',
    criteres: [
      { cle: 'b1_prise_en_main', libelle: 'Prise en main', question: 'Avez-vous pu utiliser la solution sans formation préalable approfondie ?' },
      { cle: 'b2_ergonomie', libelle: 'Ergonomie de l\'interface', question: 'L\'interface est-elle intuitive et agréable à utiliser ?' },
      { cle: 'b3_rapidite', libelle: 'Rapidité des réponses', question: 'Les délais de traitement sont-ils acceptables pour votre usage ?' },
    ],
  },
  {
    id: 'C',
    titre: 'C. Qualité des résultats',
    criteres: [
      { cle: 'c1_precision', libelle: 'Précision des réponses', question: 'Les réponses produites sont-elles exactes et fiables ?' },
      { cle: 'c2_pertinence_suggestions', libelle: 'Pertinence des suggestions', question: 'Les propositions faites par l\'IA sont-elles adaptées à votre contexte ?' },
      { cle: 'c3_gestion_cas_limites', libelle: 'Gestion des cas limites', question: 'Comment la solution se comporte-t-elle sur des sujets complexes ou sensibles ?' },
    ],
  },
  {
    id: 'D',
    titre: 'D. Fonctionnalités avancées (Fichiers & Assistants)',
    criteres: [
      { cle: 'd1_integration_fichiers_simplicite', libelle: 'Intégration de fichiers — Simplicité', question: 'La prise en main de l\'import de fichiers vous a-t-elle semblé simple et intuitive ?' },
      { cle: 'd2_integration_fichiers_analyse', libelle: 'Intégration de fichiers — Analyse', question: 'La solution a-t-elle correctement analysé et exploité le contenu de vos fichiers ?' },
      { cle: 'd3_integration_fichiers_limites', libelle: 'Intégration de fichiers — Limites', question: 'Avez-vous rencontré des limitations (taille, format, fidélité d\'interprétation) ?' },
      { cle: 'd4_assistants_configuration', libelle: 'Assistants personnalisés — Configuration', question: 'La configuration d\'un assistant (instructions, ton, périmètre) vous a-t-elle semblé accessible sans compétences techniques ?' },
      { cle: 'd5_assistants_partage', libelle: 'Assistants personnalisés — Partage', question: 'Avez-vous pu partager un assistant avec vos collègues facilement ?' },
      { cle: 'd6_assistants_coherence', libelle: 'Assistants personnalisés — Cohérence', question: 'Les assistants créés ont-ils produit des résultats cohérents avec les instructions données ?' },
    ],
  },
  {
    id: 'E',
    titre: 'E. Sécurité & Conformité',
    criteres: [
      { cle: 'e1_confidentialite', libelle: 'Confidentialité des données', question: 'Comment évaluez-vous la gestion de vos données par la solution ?' },
      { cle: 'e2_conformite_rgpd', libelle: 'Conformité RGPD perçue', question: 'La solution vous semble-t-elle respecter les exigences RGPD de votre direction ?' },
    ],
  },
  {
    id: 'F',
    titre: 'F. Intégration & adoption',
    criteres: [
      { cle: 'f1_integration_outils', libelle: 'Intégration aux outils existants', question: 'La solution s\'intègre-t-elle bien avec vos outils actuels (M365, métier…) ?' },
      { cle: 'f2_potentiel_adoption', libelle: 'Potentiel d\'adoption dans l\'équipe', question: 'Vos collègues seraient-ils prêts à utiliser cette solution au quotidien ?' },
      { cle: 'f3_formation_necessaire', libelle: 'Formation nécessaire', question: 'Quel niveau de formation seriez-vous prêt à accepter pour déployer cette solution ?' },
    ],
  },
];

const QUESTIONS_OUVERTES = [
  { cle: 'g1_points_convaincants', libelle: 'Qu\'est-ce qui vous a le plus convaincu dans cette solution ?' },
  { cle: 'g2_obstacles_adoption', libelle: 'Quels sont les principaux obstacles ou freins à son adoption selon vous ?' },
  { cle: 'g3_erreurs_hallucinations', libelle: 'Avez-vous rencontré des erreurs, hallucinations ou résultats inappropriés ?' },
  { cle: 'g4_recommandation_deploiement', libelle: 'Recommanderiez-vous le déploiement de cette solution ? Pourquoi ?' },
  { cle: 'g5_autres_remarques', libelle: 'Autres remarques, suggestions d\'amélioration ou besoins complémentaires :' },
];

const LIBELLES_NOTES = { 1: '1 — Insuffisant', 2: '2 — Passable', 3: '3 — Satisfaisant', 4: '4 — Excellent' };

// Construit l'état initial vide du formulaire
function etatInitial() {
  const etat = { direction: '', nom_prenom: '', cu1_nom: '', cu2_nom: '' };
  for (const section of SECTIONS) {
    for (const critere of section.criteres) {
      for (let cu = 1; cu <= 2; cu++) {
        etat[`${critere.cle}_cu${cu}`] = '';
      }
    }
  }
  for (const q of QUESTIONS_OUVERTES) {
    etat[q.cle] = '';
  }
  return etat;
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' },
  section: { backgroundColor: '#ffffff', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  sectionEntete: { backgroundColor: '#003189', color: '#ffffff', padding: '14px 20px', fontSize: '1rem', fontWeight: 600 },
  tableauWrapper: { overflowX: 'auto' },
  tableau: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  thBase: { padding: '10px 12px', backgroundColor: '#f0f4ff', color: '#003189', fontWeight: 600, border: '1px solid #dde3f0', textAlign: 'center', whiteSpace: 'nowrap' },
  thCritere: { padding: '10px 12px', backgroundColor: '#f0f4ff', color: '#003189', fontWeight: 600, border: '1px solid #dde3f0', textAlign: 'left', minWidth: '200px' },
  td: { padding: '10px 12px', border: '1px solid #e8ecf5', verticalAlign: 'top' },
  tdCritere: { padding: '10px 12px', border: '1px solid #e8ecf5', verticalAlign: 'top', minWidth: '200px' },
  select: { width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', cursor: 'pointer' },
  selectObligatoire: { width: '100%', padding: '6px', borderRadius: '4px', border: '2px solid #003189', fontSize: '0.85rem', cursor: 'pointer' },
  libelleCritere: { fontWeight: 600, marginBottom: '4px', color: '#1a1a2e' },
  questionCritere: { color: '#555', fontSize: '0.82rem', fontStyle: 'italic' },
  champIdent: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.95rem', boxSizing: 'border-box' },
  champIdentObligatoire: { width: '100%', padding: '10px', borderRadius: '4px', border: '2px solid #003189', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  labelQuestion: { display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1a1a2e' },
  questionBloc: { marginBottom: '20px' },
  boutonSoumettre: { backgroundColor: '#003189', color: '#ffffff', border: 'none', padding: '14px 32px', fontSize: '1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginRight: '12px' },
  boutonReset: { backgroundColor: '#888', color: '#ffffff', border: 'none', padding: '14px 24px', fontSize: '1rem', borderRadius: '6px', cursor: 'pointer' },
  alerteSucces: { backgroundColor: '#d4edda', color: '#155724', padding: '16px 20px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #c3e6cb', fontWeight: 500 },
  alerteErreur: { backgroundColor: '#f8d7da', color: '#721c24', padding: '16px 20px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #f5c6cb', fontWeight: 500 },
  noteObligatoire: { color: '#cc0000', fontSize: '0.82rem', marginTop: '4px' },
  grilleChampsIdent: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px' },
  labelIdent: { display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1a1a2e' },
  asteriqueReq: { color: '#cc0000', marginLeft: '3px' },
  legendeCU: { padding: '8px 20px 0', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' },
};

export default function FormulairePage() {
  const [formData, setFormData] = useState(etatInitial());
  const [statut, setStatut] = useState(null); // 'succes' | 'erreur'
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function reinitialiser() {
    setFormData(etatInitial());
    setStatut(null);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.direction.trim() || !formData.nom_prenom.trim()) {
      setStatut('erreur');
      setMessage('Veuillez renseigner votre direction/service et votre nom & prénom.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Vérification que le nom du CU1 est renseigné
    if (!formData.cu1_nom.trim()) {
      setStatut('erreur');
      setMessage("Veuillez saisir le nom du cas d'usage 1.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Vérification que CU1 est renseigné pour les sections obligatoires (A, B, C, E, F)
    const sectionsObligatoires = ['A', 'B', 'C', 'E', 'F'];
    for (const section of SECTIONS) {
      if (!sectionsObligatoires.includes(section.id)) continue;
      for (const critere of section.criteres) {
        if (!formData[`${critere.cle}_cu1`]) {
          setStatut('erreur');
          setMessage(`Veuillez noter au moins le cas d'usage CU1 pour tous les critères de la section ${section.id}.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    setChargement(true);
    try {
      const reponse = await fetch(`${API_URL}/api/reponses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const donnees = await reponse.json();
      if (reponse.ok) {
        setStatut('succes');
        setMessage(`Votre réponse a été enregistrée avec succès (référence n° ${donnees.id}). Merci pour votre participation.`);
        setFormData(etatInitial());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatut('erreur');
        setMessage(donnees.erreur || 'Une erreur est survenue lors de l\'envoi.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setStatut('erreur');
      setMessage('Impossible de joindre le serveur. Vérifiez votre connexion réseau.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={{ color: '#003189', marginBottom: '4px' }}>Questionnaire de retour utilisateur</h2>
      <p style={{ color: '#555', marginBottom: '24px' }}>
        Ce questionnaire permet de collecter vos retours sur le POC MIA Artemia.
        Les champs marqués <span style={{ color: '#cc0000' }}>*</span> sont obligatoires.
        La colonne CU2 est optionnelle si vous n'avez testé qu'un seul cas d'usage.
      </p>

      {statut === 'succes' && <div style={styles.alerteSucces}>{message}</div>}
      {statut === 'erreur' && <div style={styles.alerteErreur}>{message}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Identification */}
        <div style={styles.section}>
          <div style={styles.sectionEntete}>Identification du répondant</div>
          <div style={styles.grilleChampsIdent}>
            <div>
              <label style={styles.labelIdent} htmlFor="direction">
                Direction / Service <span style={styles.asteriqueReq}>*</span>
              </label>
              <input
                id="direction"
                type="text"
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                placeholder="Ex : Direction des Affaires Sociales"
                style={formData.direction ? styles.champIdent : styles.champIdentObligatoire}
                required
              />
            </div>
            <div>
              <label style={styles.labelIdent} htmlFor="nom_prenom">
                Nom & Prénom <span style={styles.asteriqueReq}>*</span>
              </label>
              <input
                id="nom_prenom"
                type="text"
                name="nom_prenom"
                value={formData.nom_prenom}
                onChange={handleChange}
                placeholder="Ex : Martin Jean"
                style={formData.nom_prenom ? styles.champIdent : styles.champIdentObligatoire}
                required
              />
            </div>
            <div>
              <label style={styles.labelIdent} htmlFor="cu1_nom">
                Nom du cas d'usage 1 <span style={styles.asteriqueReq}>*</span>
              </label>
              <input
                id="cu1_nom"
                type="text"
                name="cu1_nom"
                value={formData.cu1_nom}
                onChange={handleChange}
                placeholder="Ex : Rédaction de courriers administratifs"
                style={formData.cu1_nom ? styles.champIdent : styles.champIdentObligatoire}
                required
              />
            </div>
            <div>
              <label style={styles.labelIdent} htmlFor="cu2_nom">
                Nom du cas d'usage 2
                <span style={{ color: '#888', fontWeight: 400, marginLeft: '6px', fontSize: '0.82rem' }}>(optionnel)</span>
              </label>
              <input
                id="cu2_nom"
                type="text"
                name="cu2_nom"
                value={formData.cu2_nom}
                onChange={handleChange}
                placeholder="Ex : Synthèse de documents PDF"
                style={styles.champIdent}
              />
            </div>
          </div>
        </div>

        {/* Sections A à F avec tableau de notes */}
        {SECTIONS.map((section) => {
          const sectionsObligatoires = ['A', 'B', 'C', 'E', 'F'];
          const estObligatoire = sectionsObligatoires.includes(section.id);
          return (
            <div key={section.id} style={styles.section}>
              <div style={styles.sectionEntete}>
                {section.titre}
                {estObligatoire && <span style={{ fontSize: '0.8rem', opacity: 0.85, marginLeft: '8px' }}>(CU1 obligatoire)</span>}
              </div>
              <p style={styles.legendeCU}>
                Notation : 1 = Insuffisant, 2 = Passable, 3 = Satisfaisant, 4 = Excellent
              </p>
              <div style={styles.tableauWrapper}>
                <table style={styles.tableau}>
                  <thead>
                    <tr>
                      <th style={styles.thCritere}>Critère</th>
                      <th style={styles.thBase}>
                        {formData.cu1_nom || 'CU1'} {estObligatoire && <span style={{ color: '#ffcccc' }}>*</span>}
                      </th>
                      <th style={styles.thBase}>
                        {formData.cu2_nom || 'CU2'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.criteres.map((critere) => (
                      <tr key={critere.cle}>
                        <td style={styles.tdCritere}>
                          <div style={styles.libelleCritere}>{critere.libelle}</div>
                          <div style={styles.questionCritere}>{critere.question}</div>
                        </td>
                        {[1, 2].map((cu) => {
                          const champ = `${critere.cle}_cu${cu}`;
                          const obligatoire = estObligatoire && cu === 1;
                          return (
                            <td key={cu} style={{ ...styles.td, textAlign: 'center' }}>
                              <select
                                name={champ}
                                value={formData[champ]}
                                onChange={handleChange}
                                style={obligatoire && !formData[champ] ? styles.selectObligatoire : styles.select}
                                aria-label={`${critere.libelle} — CU${cu}`}
                              >
                                <option value="">—</option>
                                <option value="1">1 — Insuffisant</option>
                                <option value="2">2 — Passable</option>
                                <option value="3">3 — Satisfaisant</option>
                                <option value="4">4 — Excellent</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Section G — Questions ouvertes */}
        <div style={styles.section}>
          <div style={styles.sectionEntete}>G. Questions ouvertes &amp; Verbatim</div>
          <div style={{ padding: '20px' }}>
            {QUESTIONS_OUVERTES.map((q, idx) => (
              <div key={q.cle} style={styles.questionBloc}>
                <label style={styles.labelQuestion} htmlFor={q.cle}>
                  {idx + 1}. {q.libelle}
                </label>
                <textarea
                  id={q.cle}
                  name={q.cle}
                  value={formData[q.cle]}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Votre réponse (optionnel)..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Boutons de soumission */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button type="submit" style={styles.boutonSoumettre} disabled={chargement}>
            {chargement ? 'Envoi en cours...' : 'Envoyer mes réponses'}
          </button>
          <button type="button" style={styles.boutonReset} onClick={reinitialiser}>
            Réinitialiser le formulaire
          </button>
        </div>
      </form>
    </div>
  );
}
