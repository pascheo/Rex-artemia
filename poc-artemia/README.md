# POC MIA Artemia — Application d'évaluation

Application web de recueil et d'analyse des retours utilisateurs dans le cadre du POC de la solution d'IA **MIA Artemia**, déployée par la DSI du **Conseil Départemental des Yvelines (CD78)**.

---

## Prérequis

- Docker Engine 24+ et le plugin `docker compose` (ou `docker-compose` v2)
- Node.js 20+ (pour le build frontend hors Docker)
- Accès au serveur Linux (Ubuntu 22.04 LTS recommandé)

---

## Installation rapide

```bash
git clone <repo>
cd poc-artemia
chmod +x deploy.sh
./deploy.sh
```

Le script :
1. Vérifie Docker
2. Crée `.env` depuis `.env.example` si absent
3. Build le frontend React
4. Lance PostgreSQL, le backend Node.js et Nginx via Docker Compose
5. Applique les migrations Prisma
6. Injecte les données de test (seed)

**Accès** : `http://localhost` ou `http://<IP-serveur>`

---

## Configuration

Éditez le fichier `.env` avant de déployer en production :

```env
# OBLIGATOIRE — Changer en production
JWT_SECRET="votre_secret_jwt_fort_min_32_caracteres"
ADMIN_PASSWORD="VotreMotDePasseAdmin!"

# OPTIONNEL — Pour l'analyse IA dans le rapport DOCX
ANTHROPIC_API_KEY="sk-ant-..."
CLAUDE_MODEL="claude-sonnet-4-5"

# URL de l'application (pour CORS)
FRONTEND_URL="http://intranet.yvelines.fr"
```

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@cd78.fr | Admin2024! |
| DRH | marie.dupont@cd78.fr | Test2024! |
| DAF | pierre.martin@cd78.fr | Test2024! |
| DGAS | sophie.bernard@cd78.fr | Test2024! |
| Num. | thomas.leroy@cd78.fr | Test2024! |
| Social | claire.moreau@cd78.fr | Test2024! |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Nginx :80                  │
│  ┌───────────────────┐ ┌───────────────────┐ │
│  │  React (static)   │ │  /api/* → :3000   │ │
│  └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Node.js / Express  │
              │    (Prisma ORM)     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    PostgreSQL 16    │
              │    (volume Docker)  │
              └─────────────────────┘
```

---

## Routes API

### Authentification
- `POST /api/auth/login` — Connexion (email, password) → JWT
- `GET /api/auth/me` — Profil utilisateur courant

### Réponses (utilisateur)
- `GET /api/responses/my` — Lire sa propre réponse
- `POST /api/responses` — Soumettre une réponse
- `PUT /api/responses/my` — Modifier sa réponse
- `GET /api/responses/collection-status` — Statut de la collecte

### Admin — Utilisateurs
- `GET /api/admin/users` — Liste avec statut de réponse
- `POST /api/admin/users` — Créer un utilisateur
- `PATCH /api/admin/users/:id` — Modifier
- `POST /api/admin/users/:id/reset-password` — Reset MDP
- `DELETE /api/admin/users/:id` — Désactiver

### Admin — Données
- `GET /api/responses` — Toutes les réponses
- `PATCH /api/responses/collection-status` — Ouvrir/clôturer
- `GET /api/admin/dashboard` — Stats consolidées

### Rapports (admin)
- `GET /api/report/docx` — Télécharger le rapport Word
- `GET /api/report/csv` — Exporter le CSV brut

---

## Structure du projet

```
poc-artemia/
├── deploy.sh              # Script de déploiement
├── docker-compose.yml     # Orchestration des services
├── Dockerfile             # Build multi-stage backend
├── .env.example           # Template variables d'environnement
├── nginx/nginx.conf       # Reverse proxy + SPA routing
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma  # Modèle de données
│   │   └── seed.ts        # Données initiales
│   └── src/
│       ├── index.ts       # Point d'entrée Express
│       ├── auth/          # JWT utils
│       ├── middleware/     # Auth + Admin guards
│       ├── routes/        # auth, users, responses, dashboard, report
│       └── services/      # stats, docx, claude
└── frontend/
    └── src/
        ├── context/       # AuthContext
        ├── components/    # ScoreSelector, Charts, etc.
        └── pages/         # Login, User, Admin
```

---

## Développement local

```bash
# Backend
cd backend
npm install
cp ../.env.example .env
# Modifier DATABASE_URL pour pointer vers PostgreSQL local
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Sécurité

- Mots de passe hashés avec **bcrypt** (12 rounds)
- Tokens JWT expirés après **8h** (contexte intranet)
- Isolation stricte : un USER ne peut accéder qu'à ses propres données
- Routes `/api/admin/*` bloquées avec 403 pour les USERs
- Headers de sécurité Nginx (X-Frame-Options, NOSNIFF, XSS)
- CORS restreint à `FRONTEND_URL` en production
- Audit log de toutes les actions admin en base

---

## Génération du rapport DOCX

Le rapport Word généré comprend :
1. **Page de garde** (titre, date, classification)
2. **Contexte et périmètre** du POC
3. **Méthodologie** (axes, grille de notation)
4. **Résultats quantitatifs** (tableaux de scores, comparaison par direction)
5. **Analyse qualitative** (verbatim G1-G4)
6. **Analyse DSI** (générée par Claude via API Anthropic — optionnel)
7. **Plan d'action** (tableau des prochaines étapes)

Si `ANTHROPIC_API_KEY` n'est pas configurée, la section 5 contiendra un placeholder.

---

## Maintenance

```bash
# Voir les logs
docker compose logs -f backend

# Redémarrer un service
docker compose restart backend

# Accéder à la base de données
docker compose exec db psql -U poc_user -d poc_artemia

# Sauvegarder la base de données
docker compose exec db pg_dump -U poc_user poc_artemia > backup.sql

# Mettre à jour l'application
git pull
./deploy.sh
```

---

*DSI — Conseil Départemental des Yvelines (CD78) — Usage interne*
