-- Initialisation de la base de données pour POC MIA Artemia
-- CD78 — Direction des Systèmes d'Information

CREATE TABLE IF NOT EXISTS reponses (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    direction VARCHAR(255) NOT NULL,
    nom_prenom VARCHAR(255) NOT NULL,

    -- Noms des cas d'usage saisis par le répondant
    cu1_nom VARCHAR(255),
    cu2_nom VARCHAR(255),

    -- Section A : Pertinence des cas d'usage
    a1_adequation_cu1 INTEGER CHECK (a1_adequation_cu1 BETWEEN 1 AND 4),
    a1_adequation_cu2 INTEGER CHECK (a1_adequation_cu2 BETWEEN 1 AND 4),

    a2_richesse_fonctionnelle_cu1 INTEGER CHECK (a2_richesse_fonctionnelle_cu1 BETWEEN 1 AND 4),
    a2_richesse_fonctionnelle_cu2 INTEGER CHECK (a2_richesse_fonctionnelle_cu2 BETWEEN 1 AND 4),

    a3_valeur_ajoutee_cu1 INTEGER CHECK (a3_valeur_ajoutee_cu1 BETWEEN 1 AND 4),
    a3_valeur_ajoutee_cu2 INTEGER CHECK (a3_valeur_ajoutee_cu2 BETWEEN 1 AND 4),

    -- Section B : Facilité d'utilisation (UX)
    b1_prise_en_main_cu1 INTEGER CHECK (b1_prise_en_main_cu1 BETWEEN 1 AND 4),
    b1_prise_en_main_cu2 INTEGER CHECK (b1_prise_en_main_cu2 BETWEEN 1 AND 4),

    b2_ergonomie_cu1 INTEGER CHECK (b2_ergonomie_cu1 BETWEEN 1 AND 4),
    b2_ergonomie_cu2 INTEGER CHECK (b2_ergonomie_cu2 BETWEEN 1 AND 4),

    b3_rapidite_cu1 INTEGER CHECK (b3_rapidite_cu1 BETWEEN 1 AND 4),
    b3_rapidite_cu2 INTEGER CHECK (b3_rapidite_cu2 BETWEEN 1 AND 4),

    -- Section C : Qualité des résultats
    c1_precision_cu1 INTEGER CHECK (c1_precision_cu1 BETWEEN 1 AND 4),
    c1_precision_cu2 INTEGER CHECK (c1_precision_cu2 BETWEEN 1 AND 4),

    c2_pertinence_suggestions_cu1 INTEGER CHECK (c2_pertinence_suggestions_cu1 BETWEEN 1 AND 4),
    c2_pertinence_suggestions_cu2 INTEGER CHECK (c2_pertinence_suggestions_cu2 BETWEEN 1 AND 4),

    c3_gestion_cas_limites_cu1 INTEGER CHECK (c3_gestion_cas_limites_cu1 BETWEEN 1 AND 4),
    c3_gestion_cas_limites_cu2 INTEGER CHECK (c3_gestion_cas_limites_cu2 BETWEEN 1 AND 4),

    -- Section D : Fonctionnalités avancées (Fichiers & Assistants)
    d1_integration_fichiers_simplicite_cu1 INTEGER CHECK (d1_integration_fichiers_simplicite_cu1 BETWEEN 1 AND 4),
    d1_integration_fichiers_simplicite_cu2 INTEGER CHECK (d1_integration_fichiers_simplicite_cu2 BETWEEN 1 AND 4),

    d2_integration_fichiers_analyse_cu1 INTEGER CHECK (d2_integration_fichiers_analyse_cu1 BETWEEN 1 AND 4),
    d2_integration_fichiers_analyse_cu2 INTEGER CHECK (d2_integration_fichiers_analyse_cu2 BETWEEN 1 AND 4),

    d3_integration_fichiers_limites_cu1 INTEGER CHECK (d3_integration_fichiers_limites_cu1 BETWEEN 1 AND 4),
    d3_integration_fichiers_limites_cu2 INTEGER CHECK (d3_integration_fichiers_limites_cu2 BETWEEN 1 AND 4),

    d4_assistants_configuration_cu1 INTEGER CHECK (d4_assistants_configuration_cu1 BETWEEN 1 AND 4),
    d4_assistants_configuration_cu2 INTEGER CHECK (d4_assistants_configuration_cu2 BETWEEN 1 AND 4),

    d5_assistants_partage_cu1 INTEGER CHECK (d5_assistants_partage_cu1 BETWEEN 1 AND 4),
    d5_assistants_partage_cu2 INTEGER CHECK (d5_assistants_partage_cu2 BETWEEN 1 AND 4),

    d6_assistants_coherence_cu1 INTEGER CHECK (d6_assistants_coherence_cu1 BETWEEN 1 AND 4),
    d6_assistants_coherence_cu2 INTEGER CHECK (d6_assistants_coherence_cu2 BETWEEN 1 AND 4),

    -- Section E : Sécurité & Conformité
    e1_confidentialite_cu1 INTEGER CHECK (e1_confidentialite_cu1 BETWEEN 1 AND 4),
    e1_confidentialite_cu2 INTEGER CHECK (e1_confidentialite_cu2 BETWEEN 1 AND 4),

    e2_conformite_rgpd_cu1 INTEGER CHECK (e2_conformite_rgpd_cu1 BETWEEN 1 AND 4),
    e2_conformite_rgpd_cu2 INTEGER CHECK (e2_conformite_rgpd_cu2 BETWEEN 1 AND 4),

    -- Section F : Intégration & adoption
    f1_integration_outils_cu1 INTEGER CHECK (f1_integration_outils_cu1 BETWEEN 1 AND 4),
    f1_integration_outils_cu2 INTEGER CHECK (f1_integration_outils_cu2 BETWEEN 1 AND 4),

    f2_potentiel_adoption_cu1 INTEGER CHECK (f2_potentiel_adoption_cu1 BETWEEN 1 AND 4),
    f2_potentiel_adoption_cu2 INTEGER CHECK (f2_potentiel_adoption_cu2 BETWEEN 1 AND 4),

    f3_formation_necessaire_cu1 INTEGER CHECK (f3_formation_necessaire_cu1 BETWEEN 1 AND 4),
    f3_formation_necessaire_cu2 INTEGER CHECK (f3_formation_necessaire_cu2 BETWEEN 1 AND 4),

    -- Section G : Questions ouvertes & Verbatim
    g1_points_convaincants TEXT,
    g2_obstacles_adoption TEXT,
    g3_erreurs_hallucinations TEXT,
    g4_recommandation_deploiement TEXT,
    g5_autres_remarques TEXT
);
