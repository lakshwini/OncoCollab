# OncoCollab — Guide de déploiement

Application de collaboration pour oncologues.  
Ce dossier contient tout le nécessaire pour lancer OncoCollab **sans code source**.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et démarré
- Connexion internet (téléchargement des images au premier lancement)

---

## Démarrage en 3 étapes

### Étape 1 — Initialiser les fichiers de configuration

**Linux / macOS :**
```bash
bash setup.sh
```

**Windows (PowerShell) :**
```powershell
.\setup.ps1
```

Cela crée tous les fichiers `.env` à partir des exemples fournis.

---

### Étape 2 — Remplir les fichiers de configuration

Ouvre chaque fichier et remplace les valeurs par les tiennes.

#### `.env` — Configuration globale
| Variable | Description |
|---|---|
| `EXTERNAL_IP` | Ton IP publique (laisser `127.0.0.1` en local) |
| `TURN_USERNAME` | Nom d'utilisateur TURN WebRTC (libre) |
| `TURN_PASSWORD` | Mot de passe TURN WebRTC (libre) |
| `DOCKER_REGISTRY` | Ton username Docker Hub (fourni par l'équipe) |

#### `.env.backend` — API NestJS
| Variable | Description |
|---|---|
| `POSTGRES_USER` | Doit être identique à `.env.postgres` |
| `POSTGRES_PASSWORD` | Doit être identique à `.env.postgres` |
| `POSTGRES_DB` | Doit être identique à `.env.postgres` |
| `JWT_SECRET` | Clé secrète JWT — générer avec `openssl rand -hex 64` |
| `SUPABASE_URL` | URL de ton projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service Supabase |
| `TURN_USERNAME` | Doit être identique à `.env` |
| `TURN_PASSWORD` | Doit être identique à `.env` |

#### `.env.postgres` — Base de données PostgreSQL
| Variable | Description |
|---|---|
| `POSTGRES_USER` | Nom d'utilisateur (libre) |
| `POSTGRES_PASSWORD` | Mot de passe (libre) |
| `POSTGRES_DB` | Nom de la base (libre) |

#### `olga-designer/.env.back` — API Olga
| Variable | Description |
|---|---|
| `MYSQL_USERNAME` | Doit être identique à `olga-designer/.env.mysql` |
| `MYSQL_PASSWORD` | Doit être identique à `olga-designer/.env.mysql` |

#### `olga-designer/.env.mysql` — MySQL Olga
| Variable | Description |
|---|---|
| `MYSQL_ROOT_PASSWORD` | Mot de passe root MySQL (libre) |
| `MYSQL_USER` | Nom d'utilisateur (libre) |
| `MYSQL_PASSWORD` | Mot de passe (libre) |

#### `olga-designer/config/config.json` — Firebase Olga
Remplir avec les paramètres de ton projet Firebase.  
Récupérer depuis : [Firebase Console](https://console.firebase.google.com) → Paramètres du projet → Configuration

#### `olga-designer/config/apiKey.json` — Clé service Firebase
Récupérer depuis : Firebase Console → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée

---

### Étape 3 — Lancer l'application

```bash
docker compose up -d
```

Docker télécharge les images automatiquement au premier lancement (~2–5 min selon la connexion).

---

### Étape 4 — Restaurer les données MongoDB

Une fois les containers démarrés, restaurer les données MongoDB (prérequis des réunions) :

```bash
bash data/mongo/restore.sh
```

Ce script importe automatiquement la collection `meeting_prerequisites` (7 documents) dans MongoDB.

> La base PostgreSQL est initialisée automatiquement (voir section ci-dessous), seul MongoDB nécessite cette étape manuelle.

---

## Accès à l'application

| Service | URL |
|---|---|
| Application principale | http://localhost:80 |
| API Backend | http://localhost:3002 |
| Olga Designer | http://localhost:8082 |
| Olga Admin | http://localhost:8083 |

---

## Base de données PostgreSQL

Le schéma est initialisé automatiquement au premier démarrage via `data/postgres/init.sql`.

Ce script crée :
- Les tables : `roles`, `users`, `doctors`, `patients`, `rooms`, `meetings`, `messages`
- Les rôles de base : Oncologue, Médecin, Infirmier, Secrétaire

> Le script ne s'exécute qu'une seule fois, lors du tout premier démarrage (tant que le volume `postgres_data` est vide).

---

## Base de données MongoDB

MongoDB stocke les prérequis des réunions (`meeting_prerequisites`).  
L'export contient **7 documents** — restauration via `bash data/mongo/restore.sh` après le démarrage.

---

## Commandes utiles

```bash
# Voir les logs en direct
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend

# Vérifier l'état des services
docker compose ps

# Arrêter l'application (données conservées)
docker compose down

# Arrêter ET effacer toutes les données (repart de zéro)
docker compose down -v
```

---

## Structure du dossier

```
oncocollab-deploy/
├── docker-compose.yml              ← ne pas modifier
├── .env.example                    ← copier en .env et remplir
├── .env.backend.example            ← copier en .env.backend et remplir
├── .env.postgres.example           ← copier en .env.postgres et remplir
├── .env.mongo.example              ← copier en .env.mongo (généralement vide)
├── setup.sh                        ← script d'initialisation Linux/Mac
├── setup.ps1                       ← script d'initialisation Windows
├── data/
│   └── postgres/
│       └── init.sql                ← schéma BDD (automatique au 1er lancement)
└── olga-designer/
    ├── .env.back.example           ← copier en .env.back et remplir
    ├── .env.mysql.example          ← copier en .env.mysql et remplir
    └── config/
        ├── config.json.example     ← copier en config.json et remplir (Firebase)
        ├── apiKey.json.example     ← copier en apiKey.json et remplir (Firebase)
        └── nginx.conf              ← ne pas modifier
```

---

## Dépannage

**Les conteneurs ne démarrent pas :**
```bash
docker compose logs
```

**Réinitialiser complètement (supprime toutes les données) :**
```bash
docker compose down -v
docker compose up -d
```

**Port déjà utilisé :**
Modifier le port hôte dans `docker-compose.yml`, par exemple `"8080:80"` pour le frontend.
