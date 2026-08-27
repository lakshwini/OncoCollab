#!/bin/bash
# ============================================================
# start-dev.sh — Démarre la stack Docker pour développement local
# Usage : ./start-dev.sh           (démarrage normal)
#         ./start-dev.sh --reset   (reset volumes Mongo si auth foirée)
# ============================================================

set -e

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== OncoCollab - Démarrage environnement de dev ===${NC}"
echo "Dossier : $PROJECT_DIR"
echo ""

# ─────────────────────────────────────────────
# 1. Vérifier Docker
# ─────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker n'est pas démarré. Ouvre Docker Desktop puis relance ce script.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker est lancé"

# ─────────────────────────────────────────────
# 2. Détecter conflits de port côté hôte
# ─────────────────────────────────────────────
check_port() {
  local port=$1
  local name=$2
  if lsof -iTCP:"$port" -sTCP:LISTEN -nP 2>/dev/null | grep -v "com.docker" | grep -v "Docker" | grep -q LISTEN; then
    echo -e "${YELLOW}⚠${NC}  Le port $port (${name}) est occupé hors Docker. Le mapping côté hôte peut échouer."
    lsof -iTCP:"$port" -sTCP:LISTEN -nP 2>/dev/null | head -3
  else
    echo -e "${GREEN}✓${NC} Port $port (${name}) libre"
  fi
}

echo ""
echo -e "${BLUE}--- Vérification des ports hôte ---${NC}"
check_port 5433 "PostgreSQL"
check_port 27018 "MongoDB"
check_port 6333 "Qdrant"
check_port 8001 "Python Pipeline"
check_port 3307 "Olga MySQL"
check_port 3002 "Backend NestJS"

# ─────────────────────────────────────────────
# 3. Arrêt de la stack précédente
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}--- Arrêt de la stack précédente ---${NC}"
docker compose down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓${NC} Stack précédente arrêtée"

# ─────────────────────────────────────────────
# 4. Reset optionnel des volumes (si auth Mongo cassée)
# ─────────────────────────────────────────────
if [ "$1" = "--reset" ]; then
  echo ""
  echo -e "${YELLOW}⚠ Mode --reset : suppression des volumes Docker (BDD vidées)${NC}"
  docker compose down -v 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Volumes supprimés"
fi

# ─────────────────────────────────────────────
# 5. Démarrer les services backend (dans l'ordre)
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}--- Démarrage des services Docker ---${NC}"
docker compose up -d postgres mongo qdrant python-pipeline

# ─────────────────────────────────────────────
# 6. Attendre que tout soit healthy
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}--- Attente du démarrage (health checks) ---${NC}"

wait_healthy() {
  local container=$1
  local max=60
  local i=0
  while [ $i -lt $max ]; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      echo -e "${GREEN}✓${NC} $container : healthy"
      return 0
    fi
    if [ "$status" = "unhealthy" ]; then
      echo -e "${RED}❌${NC} $container : unhealthy"
      docker logs --tail 20 "$container"
      return 1
    fi
    printf "."
    sleep 2
    i=$((i+1))
  done
  echo -e "${YELLOW}⚠${NC}  $container : timeout (vérifier 'docker logs $container')"
  return 1
}

wait_healthy oncocollab_postgres
wait_healthy oncocollab_mongo
echo -e "${GREEN}✓${NC} oncocollab_qdrant : (pas de healthcheck, présumé OK)"
echo -e "${GREEN}✓${NC} oncocollab_python_pipeline : (pas de healthcheck, présumé OK)"

# ─────────────────────────────────────────────
# 7. Test connexion Mongo avec credentials
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}--- Test de connexion Mongo (auth admin) ---${NC}"
if docker exec oncocollab_mongo mongosh \
     "mongodb://admin:admin_password@localhost:27017/admin" \
     --quiet --eval "db.runCommand({ping: 1}).ok" 2>/dev/null | grep -q 1; then
  echo -e "${GREEN}✓${NC} Authentification Mongo OK"
else
  echo -e "${RED}❌${NC} L'authentification Mongo a échoué."
  echo -e "${YELLOW}   → Le volume mongo_data a probablement été créé sans .env.mongo.${NC}"
  echo -e "${YELLOW}   → Relance avec : ./start-dev.sh --reset${NC}"
  exit 1
fi

# ─────────────────────────────────────────────
# 8. Récap
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Stack Docker prête ! Services exposés :${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo "  • PostgreSQL    : localhost:5433  (user/pass dans .env.postgres)"
echo "  • MongoDB       : localhost:27018 (admin/admin_password)"
echo "  • Qdrant        : localhost:6333"
echo "  • Pipeline      : localhost:8001"
echo ""
echo -e "${BLUE}Maintenant lance le backend NestJS dans un nouveau terminal :${NC}"
echo "    cd $PROJECT_DIR/rest-api"
echo "    npm run start:dev"
echo ""
echo -e "${BLUE}Puis le frontend dans un autre terminal :${NC}"
echo "    cd $PROJECT_DIR"
echo "    npm run dev"
echo ""
echo -e "${BLUE}Pour tout arrêter :${NC}"
echo "    docker compose down"
