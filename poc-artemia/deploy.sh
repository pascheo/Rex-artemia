#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         POC MIA Artemia — Script de déploiement          ║"
echo "║         Conseil Départemental des Yvelines (CD78)        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Vérifications des prérequis ───────────────────────────────────────────────
echo "▶ Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installez Docker Engine avant de continuer."
    echo "   https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ docker compose (plugin) ou docker-compose n'est pas disponible."
    exit 1
fi

echo "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# Détecter docker compose vs docker-compose
if docker compose version &> /dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# ── Fichier .env ─────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠  Fichier .env créé depuis .env.example."
        echo "   ⚡ IMPORTANT : Modifiez JWT_SECRET et les mots de passe avant la mise en production !"
        echo "   Éditez le fichier .env puis relancez ce script."
        echo ""
        read -p "   Appuyez sur Entrée pour continuer avec les valeurs par défaut, ou Ctrl+C pour annuler... "
    else
        echo "❌ Fichier .env manquant et .env.example introuvable."
        exit 1
    fi
else
    echo "✅ Fichier .env trouvé"
fi

# ── Build du frontend ─────────────────────────────────────────────────────────
echo ""
echo "▶ Build du frontend React..."
if [ -d "frontend" ]; then
    cd frontend
    npm ci --silent
    npm run build
    cd ..
    echo "✅ Frontend buildé dans frontend/dist/"
else
    echo "⚠  Dossier frontend/ non trouvé, passage au build Docker."
fi

# ── Build et démarrage des conteneurs ────────────────────────────────────────
echo ""
echo "▶ Build et démarrage des services Docker..."
$COMPOSE down --remove-orphans 2>/dev/null || true
$COMPOSE build --no-cache
$COMPOSE up -d

echo ""
echo "▶ Attente que la base de données soit prête..."
sleep 5

# ── Migrations Prisma ─────────────────────────────────────────────────────────
echo ""
echo "▶ Application des migrations Prisma..."
$COMPOSE exec backend sh -c "npx prisma migrate deploy" || {
    echo "⚠  Tentative de création de la migration initiale..."
    $COMPOSE exec backend sh -c "npx prisma db push"
}
echo "✅ Migrations appliquées"

# ── Seed ─────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Initialisation des données (seed)..."
$COMPOSE exec backend sh -c "npx tsx prisma/seed.ts" || echo "⚠  Seed ignoré (données déjà présentes ou erreur)"

# ── Statut des services ───────────────────────────────────────────────────────
echo ""
echo "▶ Statut des services :"
$COMPOSE ps

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  ✅ Déploiement terminé !                ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Application  : http://$(hostname -I | awk '{print $1}') ou http://localhost"
echo "║  API Backend  : http://localhost:3000/health"
echo "║"
echo "║  Compte admin : admin@cd78.fr / Admin2024!"
echo "║  Comptes test : marie.dupont@cd78.fr / Test2024!"
echo "║               : pierre.martin@cd78.fr / Test2024!"
echo "║               : thomas.leroy@cd78.fr / Test2024!"
echo "║"
echo "║  ⚠  Changez les mots de passe en production !"
echo "╚══════════════════════════════════════════════════════════╝"
