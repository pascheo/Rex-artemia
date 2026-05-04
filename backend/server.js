require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Attente que PostgreSQL soit prêt avant de démarrer
async function attendrePostgres(tentatives = 10, delai = 3000) {
  for (let i = 0; i < tentatives; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connexion à PostgreSQL établie.');
      return;
    } catch (err) {
      console.log(`Tentative ${i + 1}/${tentatives} — PostgreSQL pas encore prêt. Nouvelle tentative dans ${delai / 1000}s...`);
      await new Promise((res) => setTimeout(res, delai));
    }
  }
  throw new Error('Impossible de se connecter à PostgreSQL après plusieurs tentatives.');
}

// Validation qu'une note est entre 1 et 4 ou nulle
function noteValide(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return true;
  const n = parseInt(valeur, 10);
  return Number.isInteger(n) && n >= 1 && n <= 4;
}

// Liste de tous les champs de notes (critères x CU)
const CHAMPS_NOTES = [
  'a1_adequation', 'a2_richesse_fonctionnelle', 'a3_valeur_ajoutee',
  'b1_prise_en_main', 'b2_ergonomie', 'b3_rapidite',
  'c1_precision', 'c2_pertinence_suggestions', 'c3_gestion_cas_limites',
  'd1_integration_fichiers_simplicite', 'd2_integration_fichiers_analyse', 'd3_integration_fichiers_limites',
  'd4_assistants_configuration', 'd5_assistants_partage', 'd6_assistants_coherence',
  'e1_confidentialite', 'e2_conformite_rgpd',
  'f1_integration_outils', 'f2_potentiel_adoption', 'f3_formation_necessaire',
];

const CUS = ['cu1', 'cu2', 'cu3', 'cu4', 'cu5'];

// Génère toutes les colonnes de notes sous forme de tableau plat
function tousLesChampsNotes() {
  const champs = [];
  for (const critere of CHAMPS_NOTES) {
    for (const cu of CUS) {
      champs.push(`${critere}_${cu}`);
    }
  }
  return champs;
}

const CHAMPS_VERBATIM = [
  'g1_points_convaincants',
  'g2_obstacles_adoption',
  'g3_erreurs_hallucinations',
  'g4_recommandation_deploiement',
  'g5_autres_remarques',
];

// POST /api/reponses — Enregistrement d'une réponse
app.post('/api/reponses', async (req, res) => {
  const body = req.body;

  if (!body.direction || !body.nom_prenom) {
    return res.status(400).json({ erreur: 'Les champs "direction" et "nom_prenom" sont obligatoires.' });
  }

  // Validation de toutes les notes
  const champsNotes = tousLesChampsNotes();
  for (const champ of champsNotes) {
    if (!noteValide(body[champ])) {
      return res.status(400).json({ erreur: `Valeur invalide pour le champ "${champ}". La note doit être entre 1 et 4.` });
    }
  }

  // Construction de la requête d'insertion dynamique
  const colonnes = ['direction', 'nom_prenom', ...champsNotes, ...CHAMPS_VERBATIM];
  const valeurs = colonnes.map((col) => {
    const v = body[col];
    if (v === '' || v === undefined) return null;
    if (champsNotes.includes(col) && v !== null) return parseInt(v, 10);
    return v;
  });

  const placeholders = colonnes.map((_, i) => `$${i + 1}`).join(', ');
  const requete = `INSERT INTO reponses (${colonnes.join(', ')}) VALUES (${placeholders}) RETURNING id`;

  try {
    const resultat = await pool.query(requete, valeurs);
    return res.status(201).json({ id: resultat.rows[0].id, message: 'Réponse enregistrée avec succès.' });
  } catch (err) {
    console.error('Erreur lors de l\'insertion :', err);
    return res.status(500).json({ erreur: 'Erreur interne du serveur.' });
  }
});

// GET /api/reponses — Liste toutes les réponses (filtrage optionnel par direction)
app.get('/api/reponses', async (req, res) => {
  const { direction } = req.query;
  let requete = 'SELECT * FROM reponses';
  const params = [];

  if (direction) {
    requete += ' WHERE direction ILIKE $1';
    params.push(`%${direction}%`);
  }

  requete += ' ORDER BY created_at DESC';

  try {
    const resultat = await pool.query(requete, params);
    return res.json(resultat.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération :', err);
    return res.status(500).json({ erreur: 'Erreur interne du serveur.' });
  }
});

// GET /api/reponses/consolidation — Moyennes par axe pour chaque répondant
app.get('/api/reponses/consolidation', async (req, res) => {
  // Colonnes par section pour le calcul des moyennes en SQL
  const colonnesParAxe = {
    A: ['a1_adequation_cu1','a1_adequation_cu2','a1_adequation_cu3','a1_adequation_cu4','a1_adequation_cu5',
        'a2_richesse_fonctionnelle_cu1','a2_richesse_fonctionnelle_cu2','a2_richesse_fonctionnelle_cu3','a2_richesse_fonctionnelle_cu4','a2_richesse_fonctionnelle_cu5',
        'a3_valeur_ajoutee_cu1','a3_valeur_ajoutee_cu2','a3_valeur_ajoutee_cu3','a3_valeur_ajoutee_cu4','a3_valeur_ajoutee_cu5'],
    B: ['b1_prise_en_main_cu1','b1_prise_en_main_cu2','b1_prise_en_main_cu3','b1_prise_en_main_cu4','b1_prise_en_main_cu5',
        'b2_ergonomie_cu1','b2_ergonomie_cu2','b2_ergonomie_cu3','b2_ergonomie_cu4','b2_ergonomie_cu5',
        'b3_rapidite_cu1','b3_rapidite_cu2','b3_rapidite_cu3','b3_rapidite_cu4','b3_rapidite_cu5'],
    C: ['c1_precision_cu1','c1_precision_cu2','c1_precision_cu3','c1_precision_cu4','c1_precision_cu5',
        'c2_pertinence_suggestions_cu1','c2_pertinence_suggestions_cu2','c2_pertinence_suggestions_cu3','c2_pertinence_suggestions_cu4','c2_pertinence_suggestions_cu5',
        'c3_gestion_cas_limites_cu1','c3_gestion_cas_limites_cu2','c3_gestion_cas_limites_cu3','c3_gestion_cas_limites_cu4','c3_gestion_cas_limites_cu5'],
    D: ['d1_integration_fichiers_simplicite_cu1','d1_integration_fichiers_simplicite_cu2','d1_integration_fichiers_simplicite_cu3','d1_integration_fichiers_simplicite_cu4','d1_integration_fichiers_simplicite_cu5',
        'd2_integration_fichiers_analyse_cu1','d2_integration_fichiers_analyse_cu2','d2_integration_fichiers_analyse_cu3','d2_integration_fichiers_analyse_cu4','d2_integration_fichiers_analyse_cu5',
        'd3_integration_fichiers_limites_cu1','d3_integration_fichiers_limites_cu2','d3_integration_fichiers_limites_cu3','d3_integration_fichiers_limites_cu4','d3_integration_fichiers_limites_cu5',
        'd4_assistants_configuration_cu1','d4_assistants_configuration_cu2','d4_assistants_configuration_cu3','d4_assistants_configuration_cu4','d4_assistants_configuration_cu5',
        'd5_assistants_partage_cu1','d5_assistants_partage_cu2','d5_assistants_partage_cu3','d5_assistants_partage_cu4','d5_assistants_partage_cu5',
        'd6_assistants_coherence_cu1','d6_assistants_coherence_cu2','d6_assistants_coherence_cu3','d6_assistants_coherence_cu4','d6_assistants_coherence_cu5'],
    E: ['e1_confidentialite_cu1','e1_confidentialite_cu2','e1_confidentialite_cu3','e1_confidentialite_cu4','e1_confidentialite_cu5',
        'e2_conformite_rgpd_cu1','e2_conformite_rgpd_cu2','e2_conformite_rgpd_cu3','e2_conformite_rgpd_cu4','e2_conformite_rgpd_cu5'],
    F: ['f1_integration_outils_cu1','f1_integration_outils_cu2','f1_integration_outils_cu3','f1_integration_outils_cu4','f1_integration_outils_cu5',
        'f2_potentiel_adoption_cu1','f2_potentiel_adoption_cu2','f2_potentiel_adoption_cu3','f2_potentiel_adoption_cu4','f2_potentiel_adoption_cu5',
        'f3_formation_necessaire_cu1','f3_formation_necessaire_cu2','f3_formation_necessaire_cu3','f3_formation_necessaire_cu4','f3_formation_necessaire_cu5'],
  };

  // Construction des expressions SQL pour chaque axe (ignore les NULL)
  const expressionsAxes = Object.entries(colonnesParAxe).map(([axe, cols]) => {
    const nullifs = cols.map((c) => `NULLIF(${c}, 0)`).join(', ');
    // AVG ignore automatiquement les NULL en PostgreSQL
    return `ROUND(AVG(CASE WHEN (${cols.join(' + ')}) IS NOT NULL THEN (${cols.map(c => `COALESCE(${c}, NULL)`).join(' + ')}) END)::NUMERIC, 1) AS moy_${axe.toLowerCase()}`;
  });

  // Calcul de la moyenne globale sur toutes les colonnes renseignées
  const tousChamps = Object.values(colonnesParAxe).flat();
  const moyGlobaleSQL = `ROUND((
    SELECT AVG(v) FROM (
      SELECT unnest(ARRAY[${tousChamps.map(c => `CAST(${c} AS NUMERIC)`).join(',')}]) AS v
    ) sub WHERE v IS NOT NULL
  ), 1) AS moy_globale`;

  // Requête finale avec calcul des moyennes par axe via SQL brut
  const requete = `
    SELECT
      id,
      direction,
      nom_prenom,
      created_at,
      ROUND(
        (COALESCE(a1_adequation_cu1,0) + COALESCE(a1_adequation_cu2,0) + COALESCE(a1_adequation_cu3,0) + COALESCE(a1_adequation_cu4,0) + COALESCE(a1_adequation_cu5,0) +
         COALESCE(a2_richesse_fonctionnelle_cu1,0) + COALESCE(a2_richesse_fonctionnelle_cu2,0) + COALESCE(a2_richesse_fonctionnelle_cu3,0) + COALESCE(a2_richesse_fonctionnelle_cu4,0) + COALESCE(a2_richesse_fonctionnelle_cu5,0) +
         COALESCE(a3_valeur_ajoutee_cu1,0) + COALESCE(a3_valeur_ajoutee_cu2,0) + COALESCE(a3_valeur_ajoutee_cu3,0) + COALESCE(a3_valeur_ajoutee_cu4,0) + COALESCE(a3_valeur_ajoutee_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN a1_adequation_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a1_adequation_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a1_adequation_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a1_adequation_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a1_adequation_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN a2_richesse_fonctionnelle_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a2_richesse_fonctionnelle_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a2_richesse_fonctionnelle_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a2_richesse_fonctionnelle_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a2_richesse_fonctionnelle_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN a3_valeur_ajoutee_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a3_valeur_ajoutee_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a3_valeur_ajoutee_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a3_valeur_ajoutee_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a3_valeur_ajoutee_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_a,

      ROUND(
        (COALESCE(b1_prise_en_main_cu1,0) + COALESCE(b1_prise_en_main_cu2,0) + COALESCE(b1_prise_en_main_cu3,0) + COALESCE(b1_prise_en_main_cu4,0) + COALESCE(b1_prise_en_main_cu5,0) +
         COALESCE(b2_ergonomie_cu1,0) + COALESCE(b2_ergonomie_cu2,0) + COALESCE(b2_ergonomie_cu3,0) + COALESCE(b2_ergonomie_cu4,0) + COALESCE(b2_ergonomie_cu5,0) +
         COALESCE(b3_rapidite_cu1,0) + COALESCE(b3_rapidite_cu2,0) + COALESCE(b3_rapidite_cu3,0) + COALESCE(b3_rapidite_cu4,0) + COALESCE(b3_rapidite_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN b1_prise_en_main_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b1_prise_en_main_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b1_prise_en_main_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b1_prise_en_main_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b1_prise_en_main_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN b2_ergonomie_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b2_ergonomie_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b2_ergonomie_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b2_ergonomie_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b2_ergonomie_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN b3_rapidite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b3_rapidite_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b3_rapidite_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b3_rapidite_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b3_rapidite_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_b,

      ROUND(
        (COALESCE(c1_precision_cu1,0) + COALESCE(c1_precision_cu2,0) + COALESCE(c1_precision_cu3,0) + COALESCE(c1_precision_cu4,0) + COALESCE(c1_precision_cu5,0) +
         COALESCE(c2_pertinence_suggestions_cu1,0) + COALESCE(c2_pertinence_suggestions_cu2,0) + COALESCE(c2_pertinence_suggestions_cu3,0) + COALESCE(c2_pertinence_suggestions_cu4,0) + COALESCE(c2_pertinence_suggestions_cu5,0) +
         COALESCE(c3_gestion_cas_limites_cu1,0) + COALESCE(c3_gestion_cas_limites_cu2,0) + COALESCE(c3_gestion_cas_limites_cu3,0) + COALESCE(c3_gestion_cas_limites_cu4,0) + COALESCE(c3_gestion_cas_limites_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN c1_precision_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c1_precision_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c1_precision_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c1_precision_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c1_precision_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN c2_pertinence_suggestions_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c2_pertinence_suggestions_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c2_pertinence_suggestions_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c2_pertinence_suggestions_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c2_pertinence_suggestions_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN c3_gestion_cas_limites_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c3_gestion_cas_limites_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c3_gestion_cas_limites_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c3_gestion_cas_limites_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c3_gestion_cas_limites_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_c,

      ROUND(
        (COALESCE(d1_integration_fichiers_simplicite_cu1,0) + COALESCE(d1_integration_fichiers_simplicite_cu2,0) + COALESCE(d1_integration_fichiers_simplicite_cu3,0) + COALESCE(d1_integration_fichiers_simplicite_cu4,0) + COALESCE(d1_integration_fichiers_simplicite_cu5,0) +
         COALESCE(d2_integration_fichiers_analyse_cu1,0) + COALESCE(d2_integration_fichiers_analyse_cu2,0) + COALESCE(d2_integration_fichiers_analyse_cu3,0) + COALESCE(d2_integration_fichiers_analyse_cu4,0) + COALESCE(d2_integration_fichiers_analyse_cu5,0) +
         COALESCE(d3_integration_fichiers_limites_cu1,0) + COALESCE(d3_integration_fichiers_limites_cu2,0) + COALESCE(d3_integration_fichiers_limites_cu3,0) + COALESCE(d3_integration_fichiers_limites_cu4,0) + COALESCE(d3_integration_fichiers_limites_cu5,0) +
         COALESCE(d4_assistants_configuration_cu1,0) + COALESCE(d4_assistants_configuration_cu2,0) + COALESCE(d4_assistants_configuration_cu3,0) + COALESCE(d4_assistants_configuration_cu4,0) + COALESCE(d4_assistants_configuration_cu5,0) +
         COALESCE(d5_assistants_partage_cu1,0) + COALESCE(d5_assistants_partage_cu2,0) + COALESCE(d5_assistants_partage_cu3,0) + COALESCE(d5_assistants_partage_cu4,0) + COALESCE(d5_assistants_partage_cu5,0) +
         COALESCE(d6_assistants_coherence_cu1,0) + COALESCE(d6_assistants_coherence_cu2,0) + COALESCE(d6_assistants_coherence_cu3,0) + COALESCE(d6_assistants_coherence_cu4,0) + COALESCE(d6_assistants_coherence_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN d1_integration_fichiers_simplicite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d1_integration_fichiers_simplicite_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d1_integration_fichiers_simplicite_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d1_integration_fichiers_simplicite_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d1_integration_fichiers_simplicite_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN d2_integration_fichiers_analyse_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d2_integration_fichiers_analyse_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d2_integration_fichiers_analyse_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d2_integration_fichiers_analyse_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d2_integration_fichiers_analyse_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN d3_integration_fichiers_limites_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d3_integration_fichiers_limites_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d3_integration_fichiers_limites_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d3_integration_fichiers_limites_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d3_integration_fichiers_limites_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN d4_assistants_configuration_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d4_assistants_configuration_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d4_assistants_configuration_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d4_assistants_configuration_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d4_assistants_configuration_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN d5_assistants_partage_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d5_assistants_partage_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d5_assistants_partage_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d5_assistants_partage_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d5_assistants_partage_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN d6_assistants_coherence_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d6_assistants_coherence_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d6_assistants_coherence_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d6_assistants_coherence_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d6_assistants_coherence_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_d,

      ROUND(
        (COALESCE(e1_confidentialite_cu1,0) + COALESCE(e1_confidentialite_cu2,0) + COALESCE(e1_confidentialite_cu3,0) + COALESCE(e1_confidentialite_cu4,0) + COALESCE(e1_confidentialite_cu5,0) +
         COALESCE(e2_conformite_rgpd_cu1,0) + COALESCE(e2_conformite_rgpd_cu2,0) + COALESCE(e2_conformite_rgpd_cu3,0) + COALESCE(e2_conformite_rgpd_cu4,0) + COALESCE(e2_conformite_rgpd_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN e1_confidentialite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e1_confidentialite_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e1_confidentialite_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e1_confidentialite_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e1_confidentialite_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN e2_conformite_rgpd_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e2_conformite_rgpd_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e2_conformite_rgpd_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e2_conformite_rgpd_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e2_conformite_rgpd_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_e,

      ROUND(
        (COALESCE(f1_integration_outils_cu1,0) + COALESCE(f1_integration_outils_cu2,0) + COALESCE(f1_integration_outils_cu3,0) + COALESCE(f1_integration_outils_cu4,0) + COALESCE(f1_integration_outils_cu5,0) +
         COALESCE(f2_potentiel_adoption_cu1,0) + COALESCE(f2_potentiel_adoption_cu2,0) + COALESCE(f2_potentiel_adoption_cu3,0) + COALESCE(f2_potentiel_adoption_cu4,0) + COALESCE(f2_potentiel_adoption_cu5,0) +
         COALESCE(f3_formation_necessaire_cu1,0) + COALESCE(f3_formation_necessaire_cu2,0) + COALESCE(f3_formation_necessaire_cu3,0) + COALESCE(f3_formation_necessaire_cu4,0) + COALESCE(f3_formation_necessaire_cu5,0))::NUMERIC /
        NULLIF((CASE WHEN f1_integration_outils_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f1_integration_outils_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f1_integration_outils_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f1_integration_outils_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f1_integration_outils_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN f2_potentiel_adoption_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f2_potentiel_adoption_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f2_potentiel_adoption_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f2_potentiel_adoption_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f2_potentiel_adoption_cu5 IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN f3_formation_necessaire_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f3_formation_necessaire_cu2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f3_formation_necessaire_cu3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f3_formation_necessaire_cu4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f3_formation_necessaire_cu5 IS NOT NULL THEN 1 ELSE 0 END), 0),
      1) AS moy_f,

      g1_points_convaincants,
      g2_obstacles_adoption,
      g3_erreurs_hallucinations,
      g4_recommandation_deploiement,
      g5_autres_remarques

    FROM reponses
    ORDER BY created_at DESC
  `;

  try {
    const resultat = await pool.query(requete);
    // Calcul de la moyenne globale en JavaScript à partir des moyennes par axe
    const lignes = resultat.rows.map((r) => {
      const axes = ['moy_a', 'moy_b', 'moy_c', 'moy_d', 'moy_e', 'moy_f'];
      const valeurs = axes.map((a) => parseFloat(r[a])).filter((v) => !isNaN(v) && v > 0);
      const moy_globale = valeurs.length > 0
        ? Math.round((valeurs.reduce((s, v) => s + v, 0) / valeurs.length) * 10) / 10
        : null;
      return { ...r, moy_globale };
    });
    return res.json(lignes);
  } catch (err) {
    console.error('Erreur consolidation :', err);
    return res.status(500).json({ erreur: 'Erreur interne du serveur.' });
  }
});

// GET /api/reponses/export.csv — Export CSV complet
app.get('/api/reponses/export.csv', async (req, res) => {
  try {
    const resultat = await pool.query('SELECT * FROM reponses ORDER BY created_at DESC');

    if (resultat.rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="export-artemia.csv"');
      return res.send('Aucune donnée disponible');
    }

    const colonnes = Object.keys(resultat.rows[0]);
    const ligneEntete = colonnes.join(';');

    const lignesDonnees = resultat.rows.map((row) =>
      colonnes.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(';') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(';')
    );

    const csv = '﻿' + [ligneEntete, ...lignesDonnees].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export-artemia.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('Erreur export CSV :', err);
    return res.status(500).json({ erreur: 'Erreur lors de l\'export CSV.' });
  }
});

// DELETE /api/reponses/:id — Suppression protégée par token admin
app.delete('/api/reponses/:id', async (req, res) => {
  const tokenFourni = req.headers['x-admin-token'];
  if (tokenFourni !== ADMIN_TOKEN) {
    return res.status(403).json({ erreur: 'Token administrateur invalide.' });
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erreur: 'Identifiant invalide.' });
  }

  try {
    const resultat = await pool.query('DELETE FROM reponses WHERE id = $1 RETURNING id', [id]);
    if (resultat.rowCount === 0) {
      return res.status(404).json({ erreur: 'Réponse introuvable.' });
    }
    return res.json({ message: 'Réponse supprimée avec succès.', id });
  } catch (err) {
    console.error('Erreur suppression :', err);
    return res.status(500).json({ erreur: 'Erreur interne du serveur.' });
  }
});

// Démarrage du serveur
attendrePostgres()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
