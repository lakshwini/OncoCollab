#!/bin/bash
# ============================================================
# setup.sh — OncoCollab
# Initialise les fichiers de configuration à partir des exemples
# Usage : bash setup.sh
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   OncoCollab — Configuration initiale         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [ -f "$dst" ]; then
    echo "  ⏭  Déjà présent : $dst"
  else
    cp "$src" "$dst"
    echo "  ✅ Créé         : $dst"
  fi
}

echo "📋 Création des fichiers de configuration..."
echo ""

copy_if_missing ".env.example"                              ".env"
copy_if_missing ".env.backend.example"                      ".env.backend"
copy_if_missing ".env.postgres.example"                     ".env.postgres"
copy_if_missing ".env.mongo.example"                        ".env.mongo"
copy_if_missing "olga-designer/.env.back.example"           "olga-designer/.env.back"
copy_if_missing "olga-designer/.env.mysql.example"          "olga-designer/.env.mysql"
copy_if_missing "olga-designer/config/config.json.example"  "olga-designer/config/config.json"
copy_if_missing "olga-designer/config/apiKey.json.example"  "olga-designer/config/apiKey.json"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Fichiers créés avec succès !              ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                               ║"
echo "║  👉 ETAPE SUIVANTE :                          ║"
echo "║     Ouvre et remplis ces fichiers :           ║"
echo "║       .env                                    ║"
echo "║       .env.backend                            ║"
echo "║       .env.postgres                           ║"
echo "║       olga-designer/.env.back                 ║"
echo "║       olga-designer/.env.mysql                ║"
echo "║       olga-designer/config/config.json        ║"
echo "║       olga-designer/config/apiKey.json        ║"
echo "║                                               ║"
echo "║  Puis lance :                                 ║"
echo "║     docker compose up -d                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
