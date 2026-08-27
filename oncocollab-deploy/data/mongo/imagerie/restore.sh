#!/bin/bash
# ============================================================
# restore.sh — Restauration MongoDB imagerie (OncoVision)
# Exécuter APRÈS docker compose up -d, quand imagerie-mongo est healthy
#
# Usage : bash data/mongo/imagerie/restore.sh
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   OncoCollab — Restauration MongoDB Imagerie  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Attendre que mongo soit prêt
echo "⏳ Attente que MongoDB (imagerie) soit prêt..."
until docker exec oncocollab_imagerie_mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ MongoDB (imagerie) prêt"
echo ""

# Copier l'archive dans le container
docker cp "$(dirname "$0")/dump_imagerie.archive" oncocollab_imagerie_mongo:/tmp/dump_imagerie.archive

# Restaurer
echo "📦 Restauration de la base imagerie..."
docker exec oncocollab_imagerie_mongo mongorestore \
  --archive=/tmp/dump_imagerie.archive \
  --drop

# Vérifier
COUNT=$(docker exec oncocollab_imagerie_mongo mongosh imagerie --quiet --eval "db.getCollectionNames().length" 2>/dev/null)
echo ""
echo "✅ Restauration terminée : ${COUNT} collection(s) importée(s)"
echo ""
