require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const DSI_PASSWORD_HASH = process.env.DSI_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-jwt-secret';

app.use(cors());
app.use(express.json());

// Middleware de vérification du token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ erreur: 'Authentification requise.' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erreur: 'Token invalide ou expiré.' });
  }
}

// POST /api/auth/login — Authentification DSI
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ erreur: 'Mot de passe manquant.' });
  const correct = await bcrypt.compare(password, DSI_PASSWORD_HASH);
  if (!correct) return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
  const token = jwt.sign({ role: 'dsi' }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token });
});

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

const CUS = ['cu1', 'cu2'];

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
  'cu1_nom',
  'cu2_nom',
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
app.get('/api/reponses', authenticateToken, async (req, res) => {
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
app.get('/api/reponses/consolidation', authenticateToken, async (req, res) => {
  const requete = `
    SELECT
      id,
      direction,
      nom_prenom,
      created_at,
      cu1_nom,
      cu2_nom,

      ROUND(
        (COALESCE(a1_adequation_cu1,0) + COALESCE(a1_adequation_cu2,0) +
         COALESCE(a2_richesse_fonctionnelle_cu1,0) + COALESCE(a2_richesse_fonctionnelle_cu2,0) +
         COALESCE(a3_valeur_ajoutee_cu1,0) + COALESCE(a3_valeur_ajoutee_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN a1_adequation_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a1_adequation_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN a2_richesse_fonctionnelle_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a2_richesse_fonctionnelle_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN a3_valeur_ajoutee_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN a3_valeur_ajoutee_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_a,

      ROUND(
        (COALESCE(b1_prise_en_main_cu1,0) + COALESCE(b1_prise_en_main_cu2,0) +
         COALESCE(b2_ergonomie_cu1,0) + COALESCE(b2_ergonomie_cu2,0) +
         COALESCE(b3_rapidite_cu1,0) + COALESCE(b3_rapidite_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN b1_prise_en_main_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b1_prise_en_main_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN b2_ergonomie_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b2_ergonomie_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN b3_rapidite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN b3_rapidite_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_b,

      ROUND(
        (COALESCE(c1_precision_cu1,0) + COALESCE(c1_precision_cu2,0) +
         COALESCE(c2_pertinence_suggestions_cu1,0) + COALESCE(c2_pertinence_suggestions_cu2,0) +
         COALESCE(c3_gestion_cas_limites_cu1,0) + COALESCE(c3_gestion_cas_limites_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN c1_precision_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c1_precision_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN c2_pertinence_suggestions_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c2_pertinence_suggestions_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN c3_gestion_cas_limites_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN c3_gestion_cas_limites_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_c,

      ROUND(
        (COALESCE(d1_integration_fichiers_simplicite_cu1,0) + COALESCE(d1_integration_fichiers_simplicite_cu2,0) +
         COALESCE(d2_integration_fichiers_analyse_cu1,0) + COALESCE(d2_integration_fichiers_analyse_cu2,0) +
         COALESCE(d3_integration_fichiers_limites_cu1,0) + COALESCE(d3_integration_fichiers_limites_cu2,0) +
         COALESCE(d4_assistants_configuration_cu1,0) + COALESCE(d4_assistants_configuration_cu2,0) +
         COALESCE(d5_assistants_partage_cu1,0) + COALESCE(d5_assistants_partage_cu2,0) +
         COALESCE(d6_assistants_coherence_cu1,0) + COALESCE(d6_assistants_coherence_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN d1_integration_fichiers_simplicite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d1_integration_fichiers_simplicite_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN d2_integration_fichiers_analyse_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d2_integration_fichiers_analyse_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN d3_integration_fichiers_limites_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d3_integration_fichiers_limites_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN d4_assistants_configuration_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d4_assistants_configuration_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN d5_assistants_partage_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d5_assistants_partage_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN d6_assistants_coherence_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN d6_assistants_coherence_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_d,

      ROUND(
        (COALESCE(e1_confidentialite_cu1,0) + COALESCE(e1_confidentialite_cu2,0) +
         COALESCE(e2_conformite_rgpd_cu1,0) + COALESCE(e2_conformite_rgpd_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN e1_confidentialite_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e1_confidentialite_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN e2_conformite_rgpd_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN e2_conformite_rgpd_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_e,

      ROUND(
        (COALESCE(f1_integration_outils_cu1,0) + COALESCE(f1_integration_outils_cu2,0) +
         COALESCE(f2_potentiel_adoption_cu1,0) + COALESCE(f2_potentiel_adoption_cu2,0) +
         COALESCE(f3_formation_necessaire_cu1,0) + COALESCE(f3_formation_necessaire_cu2,0))::NUMERIC /
        NULLIF((
          CASE WHEN f1_integration_outils_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f1_integration_outils_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN f2_potentiel_adoption_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f2_potentiel_adoption_cu2 IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN f3_formation_necessaire_cu1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f3_formation_necessaire_cu2 IS NOT NULL THEN 1 ELSE 0 END
        ), 0), 1) AS moy_f,

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
app.get('/api/reponses/export.csv', authenticateToken, async (req, res) => {
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

// DELETE /api/reponses/:id — Suppression protégée par JWT
app.delete('/api/reponses/:id', authenticateToken, async (req, res) => {
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
