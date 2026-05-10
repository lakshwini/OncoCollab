# OncoCollab — Guide d'installation

## Prérequis
- Docker Desktop installé (https://www.docker.com/products/docker-desktop)
- Aucun code source nécessaire

---

## Étape 1 — Configurer les fichiers d'environnement

Copier chaque fichier `.example` en retirant `.example`, puis remplir les valeurs.

### Fichiers racine

```bash
cp .env.example          .env
cp .env.backend.example  .env.backend
cp .env.postgres.example .env.postgres
cp .env.mongo.example    .env.mongo
```

### Fichiers Olga

```bash
cp olga-designer/.env.back.example  olga-designer/.env.back
cp olga-designer/.env.mysql.example olga-designer/.env.mysql

cp olga-designer/config/config.json.example  olga-designer/config/config.json
cp olga-designer/config/apiKey.json.example  olga-designer/config/apiKey.json
```

---

## Étape 2 — Lancer l'application

```bash
docker compose up -d
```

Docker télécharge automatiquement toutes les images (premier lancement ~2-5 min).

---

## Étape 3 — Accéder à l'application

| Service          | URL                        |
|------------------|----------------------------|
| Application      | http://localhost:80         |
| API Backend      | http://localhost:3002       |
| Olga Designer    | http://localhost:8082       |
| Olga Admin       | http://localhost:8083       |

---

## Commandes utiles

```bash
# Voir les logs en direct
docker compose logs -f

# Vérifier l'état des services
docker compose ps

# Arrêter l'application
docker compose down

# Arrêter ET effacer toutes les données
docker compose down -v
```

---

## Structure des fichiers

```
oncocollab/
├── docker-compose.yml          ← ne pas modifier
├── .env                        ← config TURN server
├── .env.backend                ← config API NestJS
├── .env.postgres               ← config PostgreSQL
├── .env.mongo                  ← config MongoDB
└── olga-designer/
    ├── .env.back               ← config Olga API
    ├── .env.mysql              ← config MySQL Olga
    └── config/
        ├── config.json         ← config Firebase / Olga
        └── apiKey.json         ← clé service Firebase
```
