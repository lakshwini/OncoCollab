#!/bin/bash
# ============================================================
# restore.sh — Restauration MongoDB oncocollab_prerequisites
# Exécuter APRÈS docker compose up -d, quand mongo est healthy
#
# Usage : bash data/mongo/restore.sh
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   OncoCollab — Restauration MongoDB           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Attendre que mongo soit prêt
echo "⏳ Attente que MongoDB soit prêt..."
until docker exec oncocollab_mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ MongoDB prêt"
echo ""

# Copier les fichiers dump dans le container
docker cp "$(dirname "$0")/oncocollab_prerequisites" oncocollab_mongo:/tmp/mongodump/

# Restaurer
echo "📦 Restauration de oncocollab_prerequisites (meeting_prerequisites)..."
docker exec oncocollab_mongo mongorestore \
  --db oncocollab_prerequisites \
  --drop \
  /tmp/mongodump/oncocollab_prerequisites/

# Vérifier
COUNT=$(docker exec oncocollab_mongo mongosh oncocollab_prerequisites --quiet --eval "db.meeting_prerequisites.countDocuments()" 2>/dev/null)
echo ""
echo "✅ Restauration terminée : ${COUNT} documents importés"
echo ""
