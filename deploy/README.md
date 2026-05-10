# OncoCollab — Guide de déploiement

> Application de collaboration médicale — Frontend React · Backend NestJS · Visio WebRTC · Olga Designer

---

## ⚙️ Prérequis

- **Docker Desktop** installé et **lancé**
  - Mac : https://docs.docker.com/desktop/install/mac-install/
  - Windows : https://docs.docker.com/desktop/install/windows-install/
  - Linux : https://docs.docker.com/desktop/install/linux-install/
- Aucun autre logiciel requis (Node, npm, etc.)

---

## 🔧 Installation

### Étape 1 — Configurer les variables d'environnement

Lance le script de setup automatique (copie tous les `.example` en fichiers `.env`) :

```bash
# Mac / Linux
bash setup.sh

# Windows (PowerShell)
.\setup.ps1
```

> Si tu préfères le faire manuellement, voir la section **Configuration manuelle** en bas de page.

### Étape 2 — Remplir les valeurs

Ouvre chaque fichier `.env` généré et remplace les valeurs `your_*` par celles fournies par le responsable du projet.

Fichiers à remplir :

| Fichier | Contient |
|---|---|
| `.env.backend` | Clés Supabase, JWT secret, config BDD |
| `.env.postgres` | Mot de passe PostgreSQL |
| `.env.mongo` | (optionnel en dev) |
| `.env` | Config TURN server (visio) |
| `olga-designer/.env.back` | Config MySQL Olga |
| `olga-designer/.env.mysql` | Mot de passe MySQL |
| `olga-designer/config/config.json` | Clés Firebase |
| `olga-designer/config/apiKey.json` | Clé service Firebase |

### Étape 3 — Lancer l'application

```bash
docker compose up -d
```

Premier lancement : Docker télécharge toutes les images (~2-5 min selon la connexion). Les lancements suivants sont instantanés.

Pour voir les logs en temps réel :

```bash
docker compose logs -f
```

---

## 🌐 Accès à l'application

Une fois tous les services démarrés (`docker compose ps` affiche `healthy`) :

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:8080 | Application principale |
| **Backend API** | http://localhost:3002 | API REST + WebSocket |
| **Olga Designer** | http://localhost:8082 | Éditeur de prérequis |
| **Olga Admin** | http://localhost:8083 | Interface d'administration |

---

## 🧪 Scénarios de test

### ✅ Test 1 — Connexion utilisateur

1. Ouvrir http://localhost:8080
2. Cliquer sur **Connexion**
3. Se connecter avec les identifiants de test fournis
4. Vérifier que le tableau de bord s'affiche

**Résultat attendu** : accès au dashboard sans erreur

---

### ✅ Test 2 — Créer une réunion

1. Depuis le tableau de bord, cliquer sur **Nouvelle réunion**
2. Remplir le titre, la date et les participants
3. Valider la création
4. Vérifier que la réunion apparaît dans la liste

**Résultat attendu** : réunion visible dans la liste, confirmation affichée

---

### ✅ Test 3 — Affichage du calendrier

1. Naviguer vers la section **Calendrier**
2. Vérifier que les réunions créées apparaissent
3. Changer de vue (semaine / mois) si disponible

**Résultat attendu** : calendrier chargé, événements visibles

---

### ✅ Test 4 — Formulaire de prérequis (Olga)

1. Ouvrir http://localhost:8082
2. Se connecter à Olga Designer
3. Accéder à un formulaire de prérequis existant
4. Remplir et soumettre le formulaire

**Résultat attendu** : formulaire soumis, données enregistrées

---

### ✅ Test 5 — Visioconférence

1. Depuis une réunion, cliquer sur **Rejoindre la visio**
2. Autoriser l'accès à la caméra et au micro si demandé
3. Vérifier que le flux vidéo s'affiche
4. Tester le partage d'écran si disponible

**Résultat attendu** : connexion WebRTC établie, vidéo et audio fonctionnels

---

## ❗ Dépannage

### Docker n'est pas lancé

```
Error: Cannot connect to the Docker daemon
```

**Solution** : Ouvrir Docker Desktop et attendre que l'icône whale soit stable (verte).

---

### Port déjà utilisé

```
Error: bind: address already in use (port 8080 / 3002 / 3306 / 27017)
```

**Solution** : Identifier et arrêter le processus qui occupe le port.

```bash
# Mac / Linux
lsof -i :8080        # voir quel processus utilise le port
kill -9 <PID>        # arrêter ce processus

# Windows (PowerShell)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

Ou modifier le port dans `docker-compose.yml` (ex: `"8181:80"` au lieu de `"8080:80"`).

---

### L'application ne démarre pas (backend en erreur)

```bash
# Voir les logs du backend
docker compose logs backend

# Voir les logs de tous les services
docker compose logs
```

Cause fréquente : une valeur manquante ou incorrecte dans `.env.backend`. Vérifier les clés Supabase et le JWT secret.

---

### Réinitialiser complètement

```bash
# Tout arrêter et effacer les données
docker compose down -v

# Repartir de zéro
docker compose up -d
```

---

### Mettre à jour vers une nouvelle version

```bash
docker compose pull    # télécharge les nouvelles images
docker compose up -d   # relance avec les nouvelles images
```

---

## 🗂️ Structure du dossier

```
oncocollab-deploy/
├── docker-compose.yml              ← orchestration de tous les services
├── setup.sh                        ← script de configuration automatique
├── README.md                       ← ce fichier
│
├── .env                            ← config TURN / WebRTC         (à remplir)
├── .env.backend                    ← config API NestJS            (à remplir)
├── .env.postgres                   ← config PostgreSQL            (à remplir)
├── .env.mongo                      ← config MongoDB               (optionnel)
│
└── olga-designer/
    ├── .env.back                   ← config Olga API              (à remplir)
    ├── .env.mysql                  ← config MySQL Olga            (à remplir)
    └── config/
        ├── config.json             ← config Firebase / Olga       (à remplir)
        └── apiKey.json             ← clé service Firebase         (à remplir)
```

---

## 🔧 Configuration manuelle (sans setup.sh)

```bash
cp .env.example              .env
cp .env.backend.example      .env.backend
cp .env.postgres.example     .env.postgres
cp .env.mongo.example        .env.mongo
cp olga-designer/.env.back.example   olga-designer/.env.back
cp olga-designer/.env.mysql.example  olga-designer/.env.mysql
cp olga-designer/config/config.json.example   olga-designer/config/config.json
cp olga-designer/config/apiKey.json.example   olga-designer/config/apiKey.json
```

---

## 📞 Support

En cas de problème, envoie les logs avec :

```bash
docker compose logs > oncocollab-logs.txt
```

Et partage le fichier `oncocollab-logs.txt` (il ne contient pas de données sensibles).
