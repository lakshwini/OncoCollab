# Guide d'installation et de déploiement détaillé avec Docker Compose pour Linux

## OncoCollab — Plateforme collaborative de RCP en oncologie

> **Périmètre de ce guide.** Ce document couvre le déploiement via le fichier `docker-compose.yml` situé à la racine du dépôt, qui construit l'intégralité de la stack applicative à partir du code source : le cœur OncoCollab (frontend, backend, PostgreSQL, MongoDB, Qdrant), le pipeline de compte-rendu IA (Whisper/Gemini), les services SpeechCore (transcription temps réel + Ollama), le module de formulaires/workflows Olga, et le module d'imagerie interne OncoVision (« imagerie »).
>
> Le module **PathoCollab** (visualisation de lames de pathologie) est un ensemble de microservices tiers, déployé via son **propre** `docker-compose.yml` totalement indépendant (`PathoCollab/integration/docker-compose.yml`), avec sa propre stack PostgreSQL/Redis/MinIO/Qdrant. Il est **hors périmètre** de ce guide et doit être déployé séparément si nécessaire.
>
> Le dépôt contient également un dossier `oncocollab-deploy/` — un bundle de distribution alternatif, sans code source, qui télécharge des images pré-construites depuis un registre Docker (`${DOCKER_REGISTRY}`). Cette voie est mentionnée en annexe (section 21) mais n'est **pas** le sujet principal de ce guide, car elle suppose que les images `oncocollab-*` ont été publiées au préalable sur un registre — ce qui n'a pas pu être vérifié dans le code fourni.

---

## Table des matières

1. [Prérequis système](#1-prérequis-système)
2. [Installation de Docker sous Linux](#2-installation-de-docker-sous-linux)
3. [Récupération du projet](#3-récupération-du-projet)
4. [Configuration des variables d'environnement](#4-configuration-des-variables-denvironnement)
5. [Architecture Docker](#5-architecture-docker)
6. [Construction des images](#6-construction-des-images)
7. [Démarrage de l'application](#7-démarrage-de-lapplication)
8. [Initialisation de la base de données](#8-initialisation-de-la-base-de-données)
9. [MinIO / stockage des images](#9-minio--stockage-des-images)
10. [Vérification du déploiement](#10-vérification-du-déploiement)
11. [Accès aux différents services](#11-accès-aux-différents-services)
12. [Gestion des logs](#12-gestion-des-logs)
13. [Arrêt et redémarrage](#13-arrêt-et-redémarrage)
14. [Mise à jour du projet](#14-mise-à-jour-du-projet)
15. [Persistance des données](#15-persistance-des-données)
16. [Sauvegarde et restauration](#16-sauvegarde-et-restauration)
17. [Dépannage](#17-dépannage)
18. [Nettoyage de l'environnement](#18-nettoyage-de-lenvironnement)
19. [Procédure complète rapide](#19-procédure-complète-rapide)
20. [Architecture finale](#20-architecture-finale)
21. [Annexe — bundle de distribution alternatif](#21-annexe--bundle-de-distribution-alternatif)

---

## 1. Prérequis système

Le projet ne documente pas de configuration système officielle (distribution Linux, RAM, disque). Les indications ci-dessous distinguent ce qui est **explicitement présent dans le code** de ce qui est une **estimation raisonnable**.

| Élément | Exigence | Source |
|---|---|---|
| Système | Linux, distribution moderne avec support Docker officiel (ex. Ubuntu 22.04/24.04 LTS, Debian 12) | Non spécifié dans le projet — recommandation générale |
| Architecture CPU | **x86_64 (amd64) recommandé** | 4 services (`olga-designer`, `olga-admin`, `olga-api`, `olga-mysql`) déclarent `platform: linux/amd64` dans `docker-compose.yml`. Sur une machine ARM64, Docker devra émuler ces conteneurs via QEMU (plus lent, configuration binfmt requise) |
| RAM | ≥ 16 Go recommandés (estimation) | Non documenté officiellement. Le service `ollama` est explicitement borné à **4 Go max / 2 Go réservés** (`deploy.resources` dans `docker-compose.yml`) ; à cela s'ajoutent ~20 conteneurs simultanés (6 bases de données, 9 services applicatifs construits) |
| Disque | ≥ 20 Go libres (estimation) | Non documenté. Le build télécharge/précharge un modèle Whisper et un modèle d'embeddings (`python-pipeline/Dockerfile`), Ollama télécharge `mistral:7b-q4` (~4 Go quantisé), et chaque service Node/Python a ses propres dépendances |
| Docker | Version récente avec le plugin **Compose V2** | Aucun `version:` n'est déclaré dans les fichiers compose (syntaxe Compose V2). Le fichier utilise `depends_on.condition: service_healthy`, une fonctionnalité **absente de l'ancien binaire `docker-compose` V1** — le plugin `docker compose` (V2, sans tiret) est requis |
| Docker Compose | Plugin V2 (commande `docker compose`, pas `docker-compose`) | Idem ci-dessus |
| Git | Nécessaire pour cloner le dépôt | Implicite |
| Node.js / npm | Non nécessaires sur l'hôte pour le déploiement Docker (le build se fait dans les conteneurs) — utiles seulement pour un développement hors Docker | `rest-api/README.md` mentionne Node ≥ 20.0.0 / npm ≥ 10.0.0 pour ce cas d'usage |

### Vérifier les outils installés

```bash
docker --version
docker compose version
git --version
```

La commande `docker compose version` doit afficher une version **2.x** (et non l'ancien `docker-compose version 1.x`).

---

## 2. Installation de Docker sous Linux

Si Docker n'est pas déjà installé, voici la procédure officielle standard pour une distribution basée sur Debian/Ubuntu (adapter les noms de paquets pour une autre distribution).

### 2.1 Désinstaller les anciennes versions

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

### 2.2 Installer les paquets nécessaires et ajouter le dépôt officiel Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 2.3 Installer Docker Engine et le plugin Compose V2

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> Le paquet `docker-compose-plugin` fournit la commande `docker compose` (V2), qui est **requise** pour ce projet (voir section 1).

### 2.4 Démarrer et activer le service Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker
```

### 2.5 Utiliser Docker sans `sudo`

```bash
sudo groupadd docker 2>/dev/null   # ignorer l'erreur si le groupe existe déjà
sudo usermod -aG docker $USER
newgrp docker
```

Déconnectez-vous/reconnectez-vous (ou redémarrez la session) si `newgrp docker` ne suffit pas.

### 2.6 Vérifier que Docker fonctionne

```bash
docker run hello-world
docker compose version
```

Si `docker run hello-world` affiche un message de bienvenue sans erreur de permission, l'installation est fonctionnelle.

---

## 3. Récupération du projet

⚠️ L'URL du dépôt Git n'est pas identifiable depuis les fichiers fournis (aucun fichier `.git/config` n'a pu être consulté depuis cet environnement). Remplacez le placeholder ci-dessous par l'URL réelle.

```bash
git clone <URL_DU_REPOSITORY>
cd OncoCollab
```

Le nom du dossier racine du projet, tel que présent dans l'environnement de développement, est `OncoCollab`.

---

## 4. Configuration des variables d'environnement

Le projet utilise **huit fichiers d'environnement distincts**, chacun avec son propre exemple `.example`. Le `docker-compose.yml` racine référence ces fichiers via `env_file:` pour chaque service concerné.

### 4.1 Vue d'ensemble

| Fichier réel | Exemple fourni | Utilisé par (service) |
|---|---|---|
| `.env` | `.env.example` | `coturn`, et substitution `${...}` dans `docker-compose.yml` (voir 4.3) |
| `.env.frontend` | `.env.frontend.example` | `frontend` |
| `.env.backend` | `.env.backend.example` | `backend` |
| `.env.postgres` | `.env.postgres.example` | `postgres` |
| `.env.mongo` | `.env.mongo.example` | `mongo` |
| `olga-designer/.env.front` | `olga-designer/.env.front.example` | `olga-designer`, `olga-admin` |
| `olga-designer/.env.back` | `olga-designer/.env.back.example` | `olga-api` |
| `olga-designer/.env.mysql` | `olga-designer/.env.mysql.example` | `olga-mysql` |

Copie initiale de tous les fichiers :

```bash
cp .env.example .env
cp .env.frontend.example .env.frontend
cp .env.backend.example .env.backend
cp .env.postgres.example .env.postgres
cp .env.mongo.example .env.mongo
cp olga-designer/.env.front.example olga-designer/.env.front
cp olga-designer/.env.back.example olga-designer/.env.back
cp olga-designer/.env.mysql.example olga-designer/.env.mysql
```

⚠️ Ne committez jamais ces fichiers (`.env*`, hors `.example`) — chacun porte l'avertissement « Ne jamais committer » dans son en-tête. Ne mettez jamais de véritables secrets dans ce guide ou dans un dépôt public ; les valeurs ci-dessous sont des exemples fictifs.

### 4.2 `.env` — Configuration globale

| Variable | Description | Obligatoire | Exemple |
|---|---|---|---|
| `EXTERNAL_IP` | IP publique du serveur, utilisée par le serveur TURN (coturn) pour la visioconférence WebRTC | Oui en production (défaut `127.0.0.1` en local) | `EXTERNAL_IP=203.0.113.10` |
| `IMAGERIE_SQL_ROOT_PASSWORD`, `IMAGERIE_SQL_USER`, `IMAGERIE_SQL_PASSWORD`, `IMAGERIE_SQL_DATABASE` | Identifiants MySQL du module imagerie (OncoVision) | Non — valeurs par défaut dans `docker-compose.yml` | `IMAGERIE_SQL_PASSWORD=imagerie_password` |
| `IMAGERIE_MONGO_USER`, `IMAGERIE_MONGO_PASSWORD`, `IMAGERIE_MONGO_DATABASE` | Identifiants MongoDB du module imagerie | Non — valeurs par défaut | `IMAGERIE_MONGO_PASSWORD=imagerie_password` |
| `IMAGERIE_S3_USER`, `IMAGERIE_S3_PASSWORD`, `IMAGERIE_S3_REGION` | Identifiants MinIO du module imagerie | Non — valeurs par défaut | `IMAGERIE_S3_REGION=eu-west-1` |
| `IMAGERIE_API_URL` | URL publique de l'API imagerie | Non — défaut `http://localhost:8010` | — |

**⚠️ Point d'attention important.** Le fichier `.env.example` fourni à la racine ne documente **que** `EXTERNAL_IP` et les variables `IMAGERIE_*`. Or, `docker-compose.yml` effectue plusieurs substitutions `${...}` supplémentaires qui sont lues **depuis ce même fichier `.env` racine** (et non depuis `.env.backend`) :

```bash
# À ajouter manuellement dans .env (non présentes dans .env.example) :
TURN_USERNAME=votre_utilisateur_turn
TURN_PASSWORD=votre_mot_de_passe_turn
GEMINI_API_KEY=votre_cle_gemini
WHISPER_MODEL=base
GLADIA_API_KEY=
GROQ_API_KEY=
```

Sans `TURN_USERNAME`/`TURN_PASSWORD` dans `.env`, la commande de démarrage de `coturn` (`--user=${TURN_USERNAME}:${TURN_PASSWORD}`) sera générée avec des valeurs vides. Sans `GEMINI_API_KEY` dans `.env`, le service `python-pipeline` recevra une clé vide (la génération de compte-rendu échouera). `WHISPER_MODEL` a un fallback (`:-base`), tout comme `GLADIA_API_KEY` et `GROQ_API_KEY` (`:-`, vides par défaut acceptés).

### 4.3 `.env.backend` — API NestJS

| Variable | Description | Obligatoire | Défaut |
|---|---|---|---|
| `PORT` | Port d'écoute du backend | Non | `3002` |
| `USE_HTTPS` | Active HTTPS (certificats mkcert) | Non | `false` |
| `POSTGRES_HOST`, `POSTGRES_PORT` | Connexion PostgreSQL | — | **Écrasés** par `docker-compose.yml` (`POSTGRES_HOST: postgres`, forcé) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Identifiants PostgreSQL | Oui — doivent correspondre à `.env.postgres` | — |
| `POSTGRES_DB` | Nom de la base | Oui | `OncoCollab` |
| `MONGODB_URI` | URI MongoDB | Oui | — voir point d'attention ci-dessous |
| `JWT_SECRET` | Clé de signature JWT | **Oui, obligatoire**, aucun défaut | Générer avec `openssl rand -hex 64` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` | Projet Supabase (auth + storage) | Oui | Créer un projet gratuit sur supabase.com |
| `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` | Config client TURN | Oui pour la visio | Doit correspondre à `.env` |
| `GEMINI_API_KEY` | Clé API Google Gemini | Oui pour la génération de comptes-rendus | https://aistudio.google.com/app/api-keys |
| `GEMINI_MODEL` | Modèle Gemini | Non | `gemini-1.5-flash` |
| `WHISPER_MODEL` | Modèle Whisper (tiny/base/small/medium/large) | Non | `base` |
| `QDRANT_COLLECTION` | Nom de la collection Qdrant | Non | `oncocollab_reports` |
| `SUPABASE_REPORTS_BUCKET` | Bucket Supabase pour les PDF | Non | `meeting-reports` |

**⚠️ Point d'attention important.** Dans `docker-compose.yml`, le service `backend` combine `env_file: .env.backend` **et** un bloc `environment:` qui **écrase** certaines variables avec des valeurs venant du `.env` racine (substitution `${...}`) ou des noms DNS internes fixes :

```yaml
environment:
  POSTGRES_HOST: postgres          # fixe, écrase toute valeur de .env.backend
  MONGODB_URI: ${MONGODB_URI}      # vient de .env racine, PAS de .env.backend !
  QDRANT_HOST: qdrant              # fixe
  QDRANT_PORT: "6333"              # fixe
  PIPELINE_URL: http://python-pipeline:8000   # fixe
  OLGA_BASE_URL: http://olga-api:9091         # fixe
  ...
```

Concrètement : même si `MONGODB_URI` est bien renseigné dans `.env.backend`, la valeur effectivement transmise au conteneur est celle de `${MONGODB_URI}` résolue depuis le fichier `.env` **racine**. Si `.env` racine ne définit pas `MONGODB_URI`, le conteneur backend recevra une chaîne vide. Il faut donc l'ajouter aussi dans `.env` :

```bash
# Dans .env (racine), en plus des variables listées en 4.2 :
MONGODB_URI=mongodb://mongo:27017/oncocollab_prerequisites
```

### 4.4 `.env.frontend` — React / Vite

| Variable | Description | Obligatoire | Exemple |
|---|---|---|---|
| `VITE_API_URL` | URL de l'API backend | Oui | `http://localhost:3002` |
| `VITE_WS_URL` | URL WebSocket | Oui | `ws://localhost:3002` |
| `VITE_USE_HTTPS` | HTTPS côté frontend | Non | `false` |
| `VITE_IMAGERIE_URL` | URL de l'app OncoVision (iframe) | Oui | `http://localhost:5174` |
| `VITE_IMAGERIE_API_URL` | URL de l'API imagerie-rest | Oui | `http://localhost:8010` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Projet Supabase (client) | Oui | — |
| `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_PASSWORD` | Config client TURN | Oui pour la visio | — |

⚠️ Ces variables `VITE_*` sont injectées **au moment du build** (Vite les intègre dans le bundle statique, pas au runtime) — voir le `Dockerfile` racine, étape `COPY .env.frontend .env` avant `npm run build`. Toute modification nécessite donc de reconstruire l'image frontend (`docker compose build frontend`).

### 4.5 `.env.postgres`

| Variable | Description | Obligatoire |
|---|---|---|
| `POSTGRES_USER` | Nom d'utilisateur | Oui |
| `POSTGRES_PASSWORD` | Mot de passe | Oui |
| `POSTGRES_DB` | Nom de la base | Oui — doit être `OncoCollab` pour correspondre au schéma existant |

### 4.6 `.env.mongo`

Aucune variable obligatoire. Le commentaire du fichier indique explicitement : « Pas d'authentification en dev (laisser vide). En production, ajouter `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` ».

### 4.7 `olga-designer/.env.front` (Designer + Admin)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | URL de l'API Olga — défaut `http://localhost:9091` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Projet Supabase |
| `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_PASSWORD` | Config TURN |

### 4.8 `olga-designer/.env.back` (API Olga / Spring Boot)

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | JDBC MySQL — doit référencer l'alias réseau `mysql` (`jdbc:mysql://mysql:3306/olga...`) |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Doivent correspondre à `olga-designer/.env.mysql` |
| `ADDRESS`, `PORT` | Écoute — `0.0.0.0` / `9091` |
| `FIREBASE_KEY_PATH` | Chemin du fichier de clé de service Firebase, monté en volume (`/app/config/apiKey.json`) |

### 4.9 `olga-designer/.env.mysql`

| Variable | Description |
|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Identifiants MySQL du service `olga-mysql` |

### 4.10 Fichiers de configuration additionnels (Olga)

Deux fichiers de configuration (hors variables d'environnement) sont montés en volume dans `olga-designer`/`olga-admin`/`olga-api` :

- `olga-designer/config/config.json` — configuration Firebase du frontend Olga (voir `config.json.example`) ;
- `olga-designer/config/apiKey.json` — clé de service Firebase pour l'API Olga (non présente en exemple à la racine du dépôt — un exemple existe dans `oncocollab-deploy/olga-designer/config/apiKey.json.example`).

```bash
cp olga-designer/config/config.json.example olga-designer/config/config.json
# Éditer olga-designer/config/config.json avec les paramètres réels du projet Firebase
```

⚠️ Le fichier `ARCHITECTURE_DONNEES.md` du projet indique que la configuration Firebase n'est en réalité pas utilisée ailleurs dans le code applicatif OncoCollab (elle reste spécifique au sous-module Olga, tiers).

---

## 5. Architecture Docker

### 5.1 Vue d'ensemble

```
Machine Linux
    │
    ▼
Docker Engine + Compose V2
    │
    ▼
docker-compose.yml (racine)
    │
    ├── Réseau "oncocollab" (oncocollab_network)
    │     ├── frontend, backend, postgres, mongo, qdrant
    │     ├── python-pipeline, ollama, ollama-init
    │     ├── api-websocket, api-completion
    │     ├── imagerie-mysql, imagerie-mongo, imagerie-minio,
    │     │   imagerie-rest, imagerie-app
    │     └── coturn
    │
    └── Réseau "olga" (olga_network)
          ├── olga-designer, olga-admin (aussi sur "oncocollab")
          ├── olga-api
          └── olga-mysql

  Le service "backend" est le seul rattaché aux DEUX réseaux
  (il doit joindre olga-api sur le réseau "olga").
```

### 5.2 Tableau des services

| Service | Rôle | Image / Build | Port hôte→conteneur | Réseau(x) |
|---|---|---|---|---|
| `frontend` | UI React/Vite servie par nginx | Build (`./`, `Dockerfile`) | `80:80` | oncocollab |
| `backend` | API NestJS (REST + WebSocket) | Build (`./rest-api`, `Dockerfile`) | `3002:3002` | oncocollab, olga |
| `postgres` | Base relationnelle métier | `postgres:16-alpine` | `5433:5432` | oncocollab |
| `mongo` | Prérequis de réunion (documents) | `mongo:7-jammy` | `27018:27017` | oncocollab |
| `qdrant` | Recherche sémantique (comptes-rendus) | `qdrant/qdrant:latest` | `6333:6333`, `6334:6334` | oncocollab |
| `python-pipeline` | Whisper + Gemini + ReportLab (FastAPI) | Build (`./python-pipeline`) | `8003:8000` | oncocollab |
| `ollama` | LLM local (Mistral) pour SpeechCore | `ollama/ollama:latest` | `11434:11434` | oncocollab |
| `ollama-init` | Télécharge `mistral:7b-q4` au 1er lancement | `ollama/ollama:latest` | — | oncocollab |
| `api-websocket` | Transcription temps réel (SpeechCore) | Build (`./SpeechCore/.../transcription_API_global`, `Dockerfile.api_websocket`) | `8000:8000` | oncocollab |
| `api-completion` | Complétion de formulaires par LLM | Build (`./SpeechCore/Completion_formulaire`, `DockerFile`) | `8001:8001` | oncocollab |
| `olga-designer` | Éditeur de formulaires/workflows Olga | Build (`./olga-designer`, `Dockerfile.designer`, base `kirito140/olga-designer:latest`) | `8082:80` | oncocollab, olga |
| `olga-admin` | Interface admin Olga | Build (`./olga-designer`, `Dockerfile.admin`, base `kirito140/olga-admin:latest`) | `8083:80` | oncocollab, olga |
| `olga-api` | Backend Olga | `kirito140/olga-backend:latest` | `9091:9091` | olga |
| `olga-mysql` | Base MySQL d'Olga | `mysql:8.0` | `3307:3306` | olga (alias `mysql`) |
| `imagerie-mysql` | Métadonnées d'image (OncoVision) | `mysql:8.0` | *aucun port hôte* | oncocollab |
| `imagerie-mongo` | Rooms d'annotation collaborative | `mongo:7-jammy` | *aucun port hôte* | oncocollab |
| `imagerie-minio` | Stockage objet des images (OncoVision) | `minio/minio` | `9000:9000` (API), `9001:9001` (console) | oncocollab |
| `imagerie-rest` | API FastAPI OncoVision | Build (`./imagerie/rest`) | `8010:8000` | oncocollab |
| `imagerie-app` | SPA de visualisation/annotation | Build (`./imagerie/app`) | `5174:5173` | oncocollab |
| `coturn` | Serveur TURN (relais WebRTC) | `coturn/coturn` | `3478:3478` (tcp+udp), `50000-50100:50000-50100/udp` | oncocollab |

### 5.3 Ordre de démarrage (dépendances `depends_on`)

```
postgres (healthy) ──┐
mongo (healthy) ──────┤
qdrant (started) ─────┼──► backend (healthy) ──► frontend
python-pipeline ───────┤
ollama (healthy) ──────┤
api-websocket ─────────┘

ollama (healthy) ──► ollama-init, api-websocket, api-completion

olga-mysql (healthy) ──► olga-api (healthy) ──► olga-designer, olga-admin

imagerie-mysql (healthy) ──┐
imagerie-mongo (healthy) ──┼──► imagerie-rest ──► imagerie-app
imagerie-minio (healthy) ──┘
```

Seuls `postgres`, `mongo`, `ollama`, `api-websocket`, `olga-api`, `olga-mysql`, `imagerie-mysql`, `imagerie-mongo`, `imagerie-minio` et `backend` déclarent un `healthcheck` dans `docker-compose.yml`. `qdrant` et `python-pipeline` n'en ont pas — leurs dépendants utilisent `condition: service_started` (démarrage du conteneur, pas de vérification applicative).

---

## 6. Construction des images

```bash
docker compose build
```

### Ce que fait la commande

Construit uniquement les services qui déclarent une clé `build:` dans `docker-compose.yml`, soit **9 services** :

| Service construit | Dockerfile |
|---|---|
| `frontend` | `Dockerfile` (racine, multi-stage node:20-alpine → nginx:1.25-alpine) |
| `backend` | `rest-api/Dockerfile` (multi-stage node:20-alpine) |
| `python-pipeline` | `python-pipeline/Dockerfile` (python:3.11-slim, précharge Whisper + SentenceTransformers) |
| `api-websocket` | `SpeechCore/new_transcription/transcription_API_global/Dockerfile.api_websocket` (python:3.11-slim) |
| `api-completion` | `SpeechCore/Completion_formulaire/DockerFile` (python:3.11-slim) |
| `olga-designer` | `olga-designer/Dockerfile.designer` (surcouche nginx sur `kirito140/olga-designer:latest`) |
| `olga-admin` | `olga-designer/Dockerfile.admin` (surcouche nginx sur `kirito140/olga-admin:latest`) |
| `imagerie-rest` | `imagerie/rest/Dockerfile` (python:3.13-slim) |
| `imagerie-app` | `imagerie/app/Dockerfile` (node:22-alpine) |

Les **autres services** (`postgres`, `mongo`, `qdrant`, `ollama`, `ollama-init`, `olga-api`, `olga-mysql`, `imagerie-mysql`, `imagerie-mongo`, `imagerie-minio`, `coturn`) utilisent des images déjà publiées, téléchargées automatiquement au démarrage (pas de build nécessaire pour eux).

⚠️ Le build de `python-pipeline` télécharge et précharge un modèle Whisper (taille selon `WHISPER_MODEL`, défaut `base`) ainsi qu'un modèle SentenceTransformers pendant la construction de l'image — la première exécution de `docker compose build` peut donc être longue et nécessite une connexion internet active.

### Vérifier qu'une image a été correctement créée

```bash
docker images | grep oncocollab
```

Chaque image construite doit apparaître avec un tag récent. En cas d'échec, `docker compose build <service>` (par exemple `docker compose build backend`) permet de reconstruire un seul service et d'observer les logs de build en détail.

---

## 7. Démarrage de l'application

### Différence entre `up` et `up -d`

```bash
docker compose up        # premier plan : logs affichés en continu, Ctrl+C arrête les conteneurs
docker compose up -d     # arrière-plan (detached) : rend la main immédiatement
```

Pour un déploiement, `up -d` est recommandé.

```bash
docker compose up -d
```

Si les images n'ont pas encore été construites, `docker compose up -d --build` construit puis démarre en une seule commande.

### Vérifier que les conteneurs sont démarrés

```bash
docker compose ps
```

Colonne `STATUS` à surveiller : `Up`, ou `Up (healthy)` pour les services avec `healthcheck`. Le premier démarrage peut prendre plusieurs minutes, notamment le temps que `ollama-init` télécharge le modèle `mistral:7b-q4` (~4 Go quantisé).

### Accéder à l'application

Une fois `frontend` en état `Up (healthy)` dépendant, ouvrir :

```
http://localhost
```

(port `80`, tel que défini dans `docker-compose.yml` — aucun autre port n'est utilisé pour le frontend).

---

## 8. Initialisation de la base de données

### 8.1 PostgreSQL — pas d'initialisation automatique dans ce `docker-compose.yml`

⚠️ Contrairement à `oncocollab-deploy/docker-compose.yml` (qui monte `./data/postgres:/docker-entrypoint-initdb.d:ro` sur le service `postgres`), le `docker-compose.yml` **racine** ne monte **aucun** script d'initialisation :

```yaml
postgres:
  image: postgres:16-alpine
  volumes:
    - postgres_data:/var/lib/postgresql/data   # aucun montage d'init.sql
```

Le backend NestJS utilise TypeORM avec `synchronize: false` (`rest-api/src/app.module.ts`) : le schéma doit donc **exister avant** le premier démarrage du backend, il n'est pas créé automatiquement par l'ORM.

Le schéma SQL complet existe réellement dans le dépôt, dans `oncocollab-deploy/data/postgres/init.sql`. Pour l'appliquer manuellement au conteneur `postgres` du déploiement racine :

```bash
docker compose up -d postgres
# attendre l'état "healthy"
docker compose ps postgres

docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab \
  < oncocollab-deploy/data/postgres/init.sql
```

(remplacer `<POSTGRES_USER>` par la valeur définie dans `.env.postgres`)

Ce script crée les tables principales (`roles`, `doctors`, `patients`, `rooms`, `meetings`, `messages`, `meeting_participants`, `meeting_patients`, `meeting_date_options`, `meeting_date_votes`, `meeting_roles`, `prise_en_charge_patient`, `medical_images`, `status`) ainsi que les rôles de base.

### 8.2 Migration SQL manuelle — comptes-rendus RCP

Le dépôt fournit une migration SQL prête à l'emploi, avec sa commande d'exécution documentée dans son propre en-tête (`rest-api/migrations/001_meeting_reports.sql`) :

```bash
docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab \
  < rest-api/migrations/001_meeting_reports.sql
```

Cette migration crée les tables `meeting_transcripts`, `meeting_reports` et `doctor_personal_files`.

### 8.3 Migrations TypeORM — limitation identifiée

Le dépôt contient deux migrations au format TypeORM (`MigrationInterface`) dans `rest-api/migrations/` :

- `1735400000000-AddTranscriptionBlocks.ts` — crée la table `transcription_blocks` et ajoute les colonnes `speaker_blocks`/`transcription_source` à `meeting_transcripts` ;
- `1781197041000-AddOncovisionRoomIdToMeetings.ts` — ajoute la colonne `oncovision_room_id` à `meetings`.

⚠️ Aucune configuration CLI TypeORM (`data-source.ts`, `ormconfig`) ni script npm (`migration:run`) n'a été identifié dans `rest-api/package.json` pour exécuter automatiquement ces fichiers `.ts`. Le seul script trouvé, `rest-api/src/scripts/run-migration.ts`, cible en réalité un fichier différent (`001_add_profile_image_url.sql`, non présent dans les migrations listées) et n'est pas relié à ces deux migrations. Il s'agit d'une limitation réelle du projet, pas d'une omission de ce guide.

Application manuelle équivalente (DDL déduite directement des instructions `queryRunner.createTable`/`addColumn` du code source) :

```sql
-- Équivalent SQL de AddTranscriptionBlocks1735400000000
CREATE TABLE IF NOT EXISTS transcription_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    speaker_id UUID,
    speaker_name VARCHAR(255),
    text TEXT NOT NULL,
    block_order INT NOT NULL,
    timestamp_seconds INT,
    source VARCHAR(20) NOT NULL DEFAULT 'speechcore',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transcription_blocks_meeting_order
    ON transcription_blocks(meeting_id, block_order);

ALTER TABLE meeting_transcripts ADD COLUMN IF NOT EXISTS speaker_blocks JSONB;
ALTER TABLE meeting_transcripts ADD COLUMN IF NOT EXISTS transcription_source VARCHAR(20) NOT NULL DEFAULT 'whisper';

-- Équivalent SQL de AddOncovisionRoomIdToMeetings1781197041000
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS oncovision_room_id TEXT;
```

```bash
docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab <<'SQL'
-- (coller le bloc SQL ci-dessus)
SQL
```

### 8.4 MongoDB — prérequis de réunion

MongoDB ne nécessite pas de schéma (base documentaire), mais la collection `meeting_prerequisites` peut être restaurée depuis un export fourni dans le dépôt (`oncocollab-deploy/data/mongo/oncocollab_prerequisites/`, dump `mongorestore`). Le script `oncocollab-deploy/data/mongo/restore.sh` référence explicitement le conteneur `oncocollab_mongo`, ce qui correspond au `container_name` du service `mongo` du `docker-compose.yml` racine — il est donc réutilisable tel quel :

```bash
bash oncocollab-deploy/data/mongo/restore.sh
```

Ce script attend que MongoDB réponde (`db.adminCommand('ping')`), copie le dump dans le conteneur puis exécute `mongorestore --db oncocollab_prerequisites --drop`.

Par ailleurs, deux scripts utilitaires existent pour créer des données de test manuellement (`rest-api/src/scripts/seed-prerequisites.ts`, `setup-prerequisites.ts`) — ils nécessitent d'éditer des UUID de réunions/patients/médecins réels en dur dans le fichier avant exécution via `npx ts-node`, et ne sont donc pas une étape automatisée du déploiement.

---

## 9. MinIO / stockage des images

Le projet utilise MinIO pour **un seul module** : le stockage des images du module d'imagerie interne **OncoVision** (`imagerie-minio`). Il n'existe pas d'autre service MinIO dans ce `docker-compose.yml` (le module PathoCollab a son propre MinIO, dans sa stack séparée, hors périmètre).

### Pourquoi MinIO est utilisé

`imagerie-rest` (API FastAPI d'OncoVision) stocke les fichiers image source et les tuiles Deep Zoom générées sur un stockage compatible S3, via la librairie Python `s3fs` (`imagerie/rest/database/s3/connection.py`).

### Lancement du conteneur

```yaml
imagerie-minio:
  image: minio/minio
  ports:
    - "9000:9000"   # API S3
    - "9001:9001"   # Console web
  environment:
    MINIO_ROOT_USER: ${IMAGERIE_S3_USER:-imagerie}
    MINIO_ROOT_PASSWORD: ${IMAGERIE_S3_PASSWORD:-imagerie_password}
  command: server /data --console-address ":9001"
  volumes:
    - imagerie_minio_data:/data
```

### Accéder à l'interface

```
http://localhost:9001
```

Identifiants : valeurs de `IMAGERIE_S3_USER` / `IMAGERIE_S3_PASSWORD` (`.env` racine), avec pour défaut `imagerie` / `imagerie_password` si non définies.

### Création du bucket

⚠️ Aucune création manuelle n'est nécessaire. Le bucket est créé **automatiquement par le code applicatif** au démarrage de `imagerie-rest` :

```python
# imagerie/rest/controllers/image.py
bucket = "images"  # nom en dur dans le code
...
# imagerie/rest/registry/registry.py
if not self.fs.exists(bucket_path):
    self.fs.mkdir(bucket_path)
```

Le nom du bucket, `images`, est **codé en dur** dans `imagerie/rest/controllers/image.py` (le commentaire du code indique lui-même « You can make this configurable » — ce n'est actuellement pas paramétrable par variable d'environnement).

### Comment l'application communique avec MinIO

```
Application (frontend, iframe OncoVision)
    │
    ▼
imagerie-app (SPA, port 5174)
    │
    ▼  appels API REST
imagerie-rest (FastAPI, port 8010)
    │
    ▼  s3fs (S3Connection)
imagerie-minio (port 9000, bucket "images")
    │
    ▼
Fichier image source + tuiles Deep Zoom (si applicable)
```

Les métadonnées de chaque image (identifiant, type, clé S3, préfixe des tuiles) sont stockées séparément dans `imagerie-mongo`, tandis que les binaires eux-mêmes vivent dans le bucket MinIO `images`.

---

## 10. Vérification du déploiement

### État des conteneurs

```bash
docker compose ps
```

Tous les services doivent être `Up`, et les services avec `healthcheck` (voir tableau 5.3) doivent afficher `(healthy)`.

### Logs globaux

```bash
docker compose logs
```

### Vérifications par composant

| Composant | Commande de vérification |
|---|---|
| Frontend | `curl -I http://localhost` → doit répondre `200 OK` |
| Backend | `curl http://localhost:3002/video/health` → endpoint utilisé par le `healthcheck` du service `backend` |
| PostgreSQL | `docker exec oncocollab_postgres pg_isready -U <POSTGRES_USER> -d OncoCollab` |
| MongoDB | `docker exec oncocollab_mongo mongosh --eval "db.adminCommand('ping')"` |
| Qdrant | `curl http://localhost:6333/collections` |
| MinIO (imagerie) | `curl http://localhost:9000/minio/health/live` |
| Olga API | `curl http://localhost:9091/` |
| Ollama | `curl http://localhost:11434/api/tags` (liste des modèles téléchargés, doit contenir `mistral:7b-q4`) |

### Communication entre conteneurs

```bash
docker exec oncocollab_backend wget -qO- http://postgres:5432 2>&1 | head -1   # attend une erreur de protocole (normal, confirme que le port répond)
docker network inspect oncocollab_network --format '{{range .Containers}}{{.Name}} {{end}}'
```

La seconde commande liste tous les conteneurs effectivement attachés au réseau `oncocollab_network` — utile pour confirmer qu'un service manquant n'est pas simplement mal rattaché au réseau.

---

## 11. Accès aux différents services

| Service | URL / Port | Description |
|---|---|---|
| Frontend (application principale) | http://localhost | Interface React OncoCollab |
| Backend (API + WebSocket) | http://localhost:3002 | API REST, Socket.io (visio, chat) |
| PostgreSQL | `localhost:5433` | Base relationnelle métier (accès direct via un client SQL) |
| MongoDB | `localhost:27018` | Prérequis de réunion |
| Qdrant | http://localhost:6333 (REST), `localhost:6334` (gRPC) | Recherche sémantique |
| Pipeline Python (Whisper/Gemini) | http://localhost:8003 | Génération de comptes-rendus |
| Ollama | http://localhost:11434 | LLM local (Mistral) |
| SpeechCore — API WebSocket | ws://localhost:8000 | Transcription temps réel |
| SpeechCore — API Complétion | http://localhost:8001 | Complétion de formulaires |
| Olga Designer | http://localhost:8082 | Éditeur de formulaires/workflows |
| Olga Admin | http://localhost:8083 | Administration Olga |
| Olga API | http://localhost:9091 | Backend Olga |
| Olga MySQL | `localhost:3307` | Base MySQL d'Olga |
| Imagerie REST (OncoVision) | http://localhost:8010 | API FastAPI |
| Imagerie App (OncoVision) | http://localhost:5174 | SPA de visualisation (embarquée en iframe) |
| Imagerie MinIO — API | `localhost:9000` | Stockage objet |
| Imagerie MinIO — Console | http://localhost:9001 | Interface web MinIO |
| Coturn (TURN) | `3478/tcp`, `3478/udp`, `50000-50100/udp` | Relais WebRTC |

`imagerie-mysql` et `imagerie-mongo` **n'exposent aucun port sur l'hôte** — ils ne sont accessibles que depuis le réseau Docker interne `oncocollab_network`.

---

## 12. Gestion des logs

```bash
docker compose logs
```

### Logs d'un service spécifique

```bash
docker compose logs backend
docker compose logs postgres
docker compose logs ollama
```

### Suivi en temps réel

```bash
docker compose logs -f backend
```

### Suivre plusieurs services à la fois

```bash
docker compose logs -f backend frontend postgres
```

### Limiter aux dernières lignes

```bash
docker compose logs --tail=100 -f backend
```

---

## 13. Arrêt et redémarrage

| Commande | Effet | Conséquence sur les données |
|---|---|---|
| `docker compose stop` | Arrête les conteneurs sans les supprimer | Aucune — conteneurs et volumes conservés, redémarrage rapide avec `docker compose start` |
| `docker compose down` | Arrête **et supprime** les conteneurs et le réseau | Les **volumes nommés persistent** (non supprimés par défaut) — les données survivent |
| `docker compose down -v` | Arrête, supprime conteneurs, réseau **et volumes** | ⚠️ **Suppression définitive de toutes les données** (bases de données, images stockées, modèle Ollama téléchargé) |
| `docker compose restart` | Redémarre les conteneurs sans les recréer | Aucune — équivalent à `stop` puis `start` |
| `docker compose restart <service>` | Redémarre un seul service | Aucune |

```bash
# Arrêter
docker compose stop

# Arrêter et supprimer conteneurs (données conservées)
docker compose down

# Redémarrer
docker compose restart

# Redémarrer un seul service
docker compose restart backend
```

⚠️ **`docker compose down -v` est destructif.** Il supprime `postgres_data`, `mongo_data`, `mysql_data`, `qdrant_data`, `pipeline_reports`, `ollama_data` (obligeant à re-télécharger `mistral:7b-q4`), `vosk_models_grand`, `vosk_models_small`, `imagerie_mysql_data`, `imagerie_mongo_data` et `imagerie_minio_data`. À utiliser uniquement pour repartir de zéro en connaissance de cause.

---

## 14. Mise à jour du projet

Procédure générale recommandée, adaptée au fonctionnement réel du projet :

```bash
git pull
docker compose build
docker compose up -d
```

### Cas particuliers

| Type de modification | Action nécessaire |
|---|---|
| Code source d'un service déjà construit (frontend, backend, python-pipeline, api-websocket, api-completion, olga-designer, olga-admin, imagerie-rest, imagerie-app) | `docker compose build <service>` puis `docker compose up -d <service>` |
| `Dockerfile` d'un service | Idem — `docker compose build` détecte automatiquement le changement (invalide le cache à partir de l'étape modifiée) |
| `docker-compose.yml` (nouveau service, port, volume...) | `docker compose up -d` suffit — Compose recrée uniquement les services dont la configuration a changé |
| Variables d'environnement (`.env*`) | `docker compose up -d` recrée les conteneurs concernés (les valeurs `env_file`/`environment` ne sont lues qu'au démarrage du conteneur) |
| Base de données (nouvelle migration) | Rejouer manuellement la migration concernée (voir section 8) — aucune migration n'est appliquée automatiquement au redémarrage |
| Frontend (`VITE_*`) | Reconstruire l'image (`docker compose build frontend`) — ces variables sont figées dans le bundle au moment du build, pas au runtime |

---

## 15. Persistance des données

```
Conteneur
    │
    ▼
Volume Docker nommé (driver local)
    │
    ▼
Données persistantes sur le disque hôte
```

### Volumes déclarés dans `docker-compose.yml`

| Volume | Conteneur(s) | Contenu |
|---|---|---|
| `postgres_data` | `postgres` | Base relationnelle métier (doctors, patients, meetings, roles...) |
| `mongo_data` | `mongo` | Prérequis de réunion |
| `mysql_data` | `olga-mysql` | Base MySQL d'Olga (formulaires/workflows) |
| `qdrant_data` | `qdrant` | Index vectoriel de recherche sémantique |
| `pipeline_reports` | `backend`, `python-pipeline` | PDF de comptes-rendus générés (fallback local) |
| `ollama_data` | `ollama`, `ollama-init` | Modèle `mistral:7b-q4` téléchargé |
| `vosk_models_grand`, `vosk_models_small` | `api-websocket` | Modèles Vosk (reconnaissance vocale hors-ligne) |
| `imagerie_mysql_data` | `imagerie-mysql` | Métadonnées d'images OncoVision |
| `imagerie_mongo_data` | `imagerie-mongo` | Rooms d'annotation collaborative |
| `imagerie_minio_data` | `imagerie-minio` | Fichiers image + tuiles (bucket `images`) |

Tous déclarés avec `driver: local` — les données vivent sur le disque de la machine hôte, gérées par Docker (généralement sous `/var/lib/docker/volumes/`).

### Après `docker compose down`

Les volumes nommés **ne sont pas supprimés**. Un `docker compose up -d` ultérieur les réutilise tels quels — les données sont conservées.

### Après `docker compose down -v`

⚠️ Tous les volumes listés ci-dessus sont **supprimés définitivement**. Il n'existe aucun mécanisme de sauvegarde automatique dans ce projet (voir section 16) — cette opération doit être précédée d'une sauvegarde manuelle si les données ont de la valeur.

```bash
docker volume ls | grep oncocollab   # lister les volumes existants avant suppression
```

---

## 16. Sauvegarde et restauration

⚠️ **Aucun système de sauvegarde automatisé n'est prévu dans le projet actuel** (pas de script `backup.sh`, pas de tâche planifiée identifiée dans le code). Cette section propose des commandes standard Docker/PostgreSQL/MongoDB/MinIO, à mettre en œuvre manuellement.

### PostgreSQL

```bash
# Sauvegarde
docker exec oncocollab_postgres pg_dump -U <POSTGRES_USER> -d OncoCollab > backup_postgres_$(date +%Y%m%d).sql

# Restauration
docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab < backup_postgres_20260101.sql
```

### MongoDB

```bash
# Sauvegarde
docker exec oncocollab_mongo mongodump --db oncocollab_prerequisites --archive > backup_mongo_$(date +%Y%m%d).archive

# Restauration
docker exec -i oncocollab_mongo mongorestore --db oncocollab_prerequisites --archive --drop < backup_mongo_20260101.archive
```

### MySQL (Olga)

```bash
docker exec oncocollab_olga_mysql mysqldump -u <MYSQL_USER> -p<MYSQL_PASSWORD> olga > backup_olga_mysql_$(date +%Y%m%d).sql
```

### Volumes MinIO (imagerie)

MinIO ne fournit pas de commande `dump` native — la sauvegarde se fait au niveau du volume Docker sous-jacent :

```bash
docker run --rm -v oncocollab_imagerie_minio_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/imagerie_minio_backup_$(date +%Y%m%d).tar.gz -C /data .
```

(le nom exact du volume peut être préfixé par le nom du projet Compose — vérifier avec `docker volume ls | grep imagerie_minio_data`)

### Résumé — volumes à sauvegarder en priorité

| Volume | Priorité | Raison |
|---|---|---|
| `postgres_data` | Critique | Données métier (patients, réunions, médecins) |
| `mongo_data` | Élevée | Prérequis de réunion |
| `imagerie_minio_data`, `imagerie_mysql_data`, `imagerie_mongo_data` | Élevée | Images médicales et leurs métadonnées |
| `mysql_data` (Olga) | Moyenne | Formulaires/workflows |
| `pipeline_reports` | Moyenne | PDF (les originaux structurés restent en base PostgreSQL) |
| `ollama_data`, `vosk_models_*`, `qdrant_data` | Faible | Re-téléchargeables/reconstructibles automatiquement |

**Limite / recommandation.** Ce projet, étant un POC, ne dispose d'aucune stratégie de sauvegarde planifiée (cron, outil dédié type `pgBackRest`, réplication). Pour un usage au-delà du POC, la mise en place de sauvegardes automatisées et testées est une évolution nécessaire, non couverte par l'état actuel du code.

---

## 17. Dépannage

### Les conteneurs ne démarrent pas

```bash
docker compose ps
docker compose logs
```

Vérifier en particulier l'état `Exited` ou `Restarting` en boucle, révélateur d'une erreur de configuration (variable d'environnement manquante, connexion base de données refusée).

### Un port est déjà utilisé

```bash
sudo lsof -i :<PORT>
# ou
sudo ss -tulpn | grep <PORT>
```

Identifier le processus (ou conteneur Docker) qui occupe le port, puis soit l'arrêter, soit modifier le mapping dans `docker-compose.yml` (par exemple `"8080:80"` au lieu de `"80:80"` pour le frontend).

### Le backend ne communique pas avec la base de données

Vérifications, dans l'ordre :

1. **Nom du service Docker** : le backend doit se connecter à `postgres` (nom du service, pas `localhost`) — confirmé par `POSTGRES_HOST: postgres` forcé dans `docker-compose.yml`.
2. **Port interne** : `5432` (port interne du conteneur, pas `5433` qui est le port hôte).
3. **Variables d'environnement** : `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` cohérents entre `.env.postgres` et `.env.backend`.
4. **Réseau Docker** : `backend` et `postgres` doivent être sur le même réseau (`oncocollab`) — vérifier avec `docker network inspect oncocollab_network`.
5. **État du conteneur** : `docker compose ps postgres` doit afficher `healthy` avant que le backend ne parvienne à se connecter (le `depends_on: condition: service_healthy` du backend devrait déjà garantir cet ordre).
6. **Schéma initialisé** : voir section 8.1 — si le schéma SQL n'a jamais été appliqué manuellement, les requêtes du backend échoueront avec des erreurs « relation does not exist ».

### MinIO (imagerie) n'est pas accessible

```bash
docker compose logs imagerie-minio
docker exec oncocollab_imagerie_minio curl -f http://localhost:9000/minio/health/live
```

Vérifier que `imagerie-rest` a bien démarré **après** `imagerie-minio` (dépendance `condition: service_healthy`), et que `IMAGERIE_S3_USER`/`IMAGERIE_S3_PASSWORD` sont cohérents entre le `.env` racine et ce qui a été utilisé pour créer le volume `imagerie_minio_data` (un changement de mot de passe après la création initiale du volume ne met pas à jour les identifiants déjà stockés par MinIO).

### Le frontend ne peut pas contacter le backend

1. Vérifier `VITE_API_URL` dans `.env.frontend` — doit correspondre à l'URL réellement accessible depuis le navigateur de l'utilisateur (`http://localhost:3002` en local, ou l'IP publique en déploiement distant).
2. Rappel : ces variables sont figées **au build** — un changement nécessite `docker compose build frontend`.
3. Vérifier les CORS : `rest-api/src/main.ts` configure `app.enableCors({ origin: true, credentials: true, ... })` — en théorie permissif, mais vérifier qu'aucun proxy/reverse-proxy intermédiaire ne bloque les en-têtes `Authorization`.
4. Vérifier que `backend` est bien `healthy` (`docker compose ps backend`) — `frontend` en dépend directement (`depends_on: backend: condition: service_healthy`).

### `ollama-init` reste bloqué longtemps

Normal au premier démarrage : ce service télécharge `mistral:7b-q4` (plusieurs Go), sa durée dépend de la connexion internet. Suivre la progression avec :

```bash
docker compose logs -f ollama-init
```

---

## 18. Nettoyage de l'environnement

| Commande | Effet |
|---|---|
| `docker compose down` | Supprime conteneurs + réseau du projet — **volumes conservés** |
| `docker compose down -v` | ⚠️ Supprime en plus tous les volumes nommés — **perte de données définitive** |
| `docker compose down --rmi local` | Supprime en plus les images construites localement (les 9 services buildés) |
| `docker system prune` | ⚠️ Nettoie **globalement** les ressources Docker inutilisées sur la machine (conteneurs arrêtés, réseaux orphelins, images non taguées) — affecte potentiellement d'autres projets Docker sur la même machine |
| `docker system prune -a --volumes` | ⚠️⚠️ Très destructif — supprime toutes les images non utilisées par un conteneur en cours **et tous les volumes non utilisés**, sur toute la machine, tous projets confondus |

```bash
# Nettoyage standard, sans perte de données
docker compose down

# Nettoyage complet du projet (perte de données)
docker compose down -v --rmi local
```

⚠️ Les commandes `docker system prune` agissent au niveau de **toute la machine Docker**, pas seulement de ce projet — à utiliser avec prudence si d'autres projets Docker tournent sur la même machine.

---

## 19. Procédure complète rapide

```bash
# 1. Récupération
git clone <URL_DU_REPOSITORY>
cd OncoCollab

# 2. Configuration
cp .env.example .env
cp .env.frontend.example .env.frontend
cp .env.backend.example .env.backend
cp .env.postgres.example .env.postgres
cp .env.mongo.example .env.mongo
cp olga-designer/.env.front.example olga-designer/.env.front
cp olga-designer/.env.back.example olga-designer/.env.back
cp olga-designer/.env.mysql.example olga-designer/.env.mysql
cp olga-designer/config/config.json.example olga-designer/config/config.json
# → Éditer chaque fichier .env* avec vos valeurs (voir section 4)
# → Ajouter TURN_USERNAME, TURN_PASSWORD, GEMINI_API_KEY, MONGODB_URI dans .env (voir 4.2/4.3)

# 3. Construction
docker compose build

# 4. Démarrage
docker compose up -d

# 5. Initialisation de la base PostgreSQL (une seule fois)
docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab \
  < oncocollab-deploy/data/postgres/init.sql
docker exec -i oncocollab_postgres psql -U <POSTGRES_USER> -d OncoCollab \
  < rest-api/migrations/001_meeting_reports.sql
# (+ migrations TypeORM manuelles, voir section 8.3)

# 6. Restauration des prérequis MongoDB (une seule fois)
bash oncocollab-deploy/data/mongo/restore.sh

# 7. Vérification
docker compose ps
docker compose logs -f
```

Application accessible sur **http://localhost**.

---

## 20. Architecture finale

```
Machine Linux
    │
    ▼
Docker Engine + Docker Compose V2
    │
    ▼
docker-compose.yml
    │
    ┌───────────────┬──────────────┬───────────────┬──────────────┬───────────────┐
    ▼               ▼              ▼                ▼              ▼               ▼
Frontend         Backend      Bases de données   IA / Voix     Formulaires      Imagerie
(nginx/React)    (NestJS)     PostgreSQL          Whisper       Olga             OncoVision
    │                │        MongoDB             Gemini        (Designer/       (MySQL+Mongo+
    │                │        Qdrant              Ollama+       Admin/API/       MinIO+FastAPI+
    │                │                             Mistral       MySQL)           SPA)
    │                │                             Vosk/                          │
    │                │                             Gladia/Groq                    │
    │                │                                                            │
    │                └──────────────► Coturn (TURN, WebRTC) ◄─────────────────────┘
    │
    └──────────────► http://localhost (point d'entrée utilisateur unique)
```

Ce schéma représente l'ensemble des 20 services déclarés dans `docker-compose.yml`, regroupés par domaine fonctionnel (voir section 5.2 pour le détail service par service). Le module **PathoCollab**, avec sa propre stack Docker Compose indépendante, n'apparaît pas ici (hors périmètre — voir section 21 et l'avertissement en tête de document).

---

## 21. Annexe — bundle de distribution alternatif

Le dépôt contient un second chemin de déploiement, dans `oncocollab-deploy/`, conçu pour une personne **sans accès au code source** :

- `docker-compose.yml` propre à ce dossier, référencant des images `${DOCKER_REGISTRY}/oncocollab-*:latest` au lieu de sections `build:` ;
- `setup.sh` / `setup.ps1` pour initialiser automatiquement les fichiers `.env*` depuis leurs exemples ;
- `data/postgres/init.sql` monté automatiquement sur `/docker-entrypoint-initdb.d` (contrairement au `docker-compose.yml` racine, voir section 8.1) ;
- `data/mongo/` — dump `mongorestore` prêt à l'emploi + script `restore.sh` ;
- Une documentation API complète dans son `README.md`.

⚠️ **Point de prudence.** Cette voie suppose que les images `oncocollab-frontend`, `oncocollab-backend`, `oncocollab-python-pipeline`, `oncocollab-olga-designer`, `oncocollab-olga-admin`, `oncocollab-api-websocket`, `oncocollab-api-completion`, `oncocollab-imagerie-rest` et `oncocollab-imagerie-app` ont été construites et publiées au préalable sur un registre Docker Hub par l'équipe projet. Cette publication n'a pas pu être vérifiée depuis le code fourni — si les images ne sont pas disponibles sur le registre indiqué par `DOCKER_REGISTRY`, `docker compose up -d` échouera au moment du `pull`. La procédure de build-from-source décrite dans les sections 1 à 20 de ce guide reste la voie garantie de fonctionner, puisqu'elle repose uniquement sur des Dockerfiles présents et vérifiés dans le dépôt.
