# POC MIA Artemia — Application de collecte de retours utilisateurs

Application web full-stack permettant aux agents du Conseil Départemental des Yvelines (CD78) de saisir leurs retours sur le POC MIA Artemia, et à la DSI de consulter et exporter les résultats consolidés.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) (version 20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2+)

Vérifiez votre installation :
```bash
docker --version
docker compose version
```

## Démarrage rapide

```bash
git clone https://github.com/pascheo/Rex-artemia.git
cd Rex-artemia
docker compose up -d
```

L'application est accessible après environ 30 secondes (le temps de compiler le frontend) :

| Interface | URL |
|-----------|-----|
| Formulaire agent | http://localhost:3000 |
| Tableau de bord DSI | http://localhost:3000/dashboard |
| API backend | http://localhost:3001 |

## Structure du projet

```
rex-artemia/
├── docker-compose.yml          # Orchestration des services
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js               # API REST Express
│   └── db/
│       └── init.sql            # Schéma PostgreSQL
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── pages/
            ├── FormulairePage.jsx   # Questionnaire utilisateur
            └── DashboardPage.jsx    # Tableau de bord DSI
```

## Configuration

### Changer le mot de passe DSI

Le tableau de bord DSI est protégé par un mot de passe. Pour le changer :

1. Générez le hash du nouveau mot de passe :
```bash
cd backend
node scripts/generate-password.js nouveaumotdepasse
```

2. Copiez le hash affiché dans le terminal.

3. Remplacez la valeur de `DSI_PASSWORD_HASH` dans `docker-compose.yml` :
```yaml
backend:
  environment:
    DSI_PASSWORD_HASH: "$2a$10$votre-hash-genere-ici"
```

4. Relancez le backend :
```bash
docker compose up -d --build backend
```

Le mot de passe par défaut est `changeme`. **Changez-le avant tout déploiement en production.**

### Déploiement sur un serveur interne

Si l'application est hébergée sur un serveur accessible via IP (ex : `192.168.1.10`), modifiez `docker-compose.yml` :
```yaml
frontend:
  build:
    args:
      VITE_API_URL: http://192.168.1.10:3001
```

Puis reconstruisez :
```bash
docker compose up -d --build
```

## Gestion de l'application

### Voir les logs
```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Arrêter l'application
```bash
docker compose down
```

### Arrêter et supprimer toutes les données (attention : irréversible)
```bash
docker compose down -v
```

### Redémarrer après mise à jour du code
```bash
docker compose up -d --build
```

## Sauvegarde de la base de données

### Exporter la base
```bash
docker compose exec postgres pg_dump -U artemia artemia > sauvegarde-artemia-$(date +%Y%m%d).sql
```

### Restaurer une sauvegarde
```bash
cat sauvegarde-artemia-YYYYMMDD.sql | docker compose exec -T postgres psql -U artemia artemia
```

## API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reponses` | Enregistrer une réponse |
| GET | `/api/reponses` | Lister toutes les réponses |
| GET | `/api/reponses?direction=xxx` | Filtrer par direction |
| GET | `/api/reponses/consolidation` | Moyennes par axe et par répondant |
| GET | `/api/reponses/export.csv` | Export CSV complet |
| DELETE | `/api/reponses/:id` | Supprimer une réponse (token requis) |

Les routes GET et DELETE sont protégées par JWT (header `Authorization: Bearer <token>`).
Le token est obtenu via `POST /api/auth/login` avec `{ "password": "..." }`.
`POST /api/reponses` reste public (formulaire agent).

## Structure du questionnaire

Le formulaire couvre 6 sections notées de 1 à 4 (Insuffisant -> Excellent), pour jusqu'a 5 cas d'usage (CU1 a CU5) :

- **A. Pertinence des cas d'usage** (3 critères)
- **B. Facilité d'utilisation / UX** (3 critères)
- **C. Qualité des résultats** (3 critères)
- **D. Fonctionnalités avancées** (6 critères — Fichiers & Assistants)
- **E. Sécurité & Conformité** (2 critères)
- **F. Intégration & adoption** (3 critères)
- **G. Questions ouvertes** (5 champs texte libres)

Seul CU1 est obligatoire pour les sections A, B, C, E et F. Les autres cas d'usage sont optionnels.
