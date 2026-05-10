#!/bin/bash
# ============================================================
# setup.sh — OncoCollab
# Copie tous les fichiers .example en fichiers .env prêts à remplir
# Usage : bash setup.sh
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   OncoCollab — Setup de configuration        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

copy_if_missing() {
  local src="$1"
  local dst="$2"

  if [ -f "$dst" ]; then
    echo "  ⏭️  Déjà présent : $dst (ignoré)"
  else
    cp "$src" "$dst"
    echo "  ✅ Créé         : $dst"
  fi
}

echo "📋 Copie des fichiers de configuration..."
echo ""

copy_if_missing ".env.example"             ".env"
copy_if_missing ".env.backend.example"     ".env.backend"
copy_if_missing ".env.postgres.example"    ".env.postgres"
copy_if_missing ".env.mongo.example"       ".env.mongo"

copy_if_missing "olga-designer/.env.back.example"              "olga-designer/.env.back"
copy_if_missing "olga-designer/.env.mysql.example"             "olga-designer/.env.mysql"
copy_if_missing "olga-designer/config/config.json.example"     "olga-designer/config/config.json"
copy_if_missing "olga-designer/config/apiKey.json.example"     "olga-designer/config/apiKey.json"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Fichiers créés !                          ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  👉 Remplis maintenant les fichiers .env      ║"
echo "║     avec les valeurs fournies.                ║"
echo "║                                               ║"
echo "║  Puis lance :                                 ║"
echo "║     docker compose up -d                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
