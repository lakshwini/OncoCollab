# OncoCollab — Guide de déploiement

Application de collaboration pour oncologues.  
Ce dossier contient tout le nécessaire pour lancer OncoCollab **sans code source**.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et démarré
- Connexion internet (téléchargement des images au premier lancement)

> ℹ️ Toutes les images applicatives (`oncocollab-frontend`, `oncocollab-backend`, `oncocollab-python-pipeline`, `oncocollab-olga-designer`, `oncocollab-olga-admin`, `oncocollab-api-websocket`, `oncocollab-api-completion`, `oncocollab-imagerie-rest`, `oncocollab-imagerie-app`) doivent être publiées sur `${DOCKER_REGISTRY}` (Docker Hub) par l'équipe avant le déploiement.
>
> ⚠️ **Cas particulier du frontend** : React/Vite intègre les variables `VITE_*` (URL de l'API, Supabase, TURN...) **dans le bundle statique au moment du build**, pas au runtime. L'image `oncocollab-frontend` publiée sur le registre embarque donc déjà une configuration figée, définie par l'équipe au moment du build. Si vous devez pointer vers un backend/Supabase/TURN différent, demandez à l'équipe de reconstruire et republier l'image avec un `.env.frontend` mis à jour (aucune variable d'environnement de ce `docker-compose.yml` ne peut changer ce comportement après coup).

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
| `GLADIA_API_KEY` | Clé API Gladia (transcription temps réel SpeechCore) — https://app.gladia.io |
| `GROQ_API_KEY` | Clé API Groq (LLM de secours pour SpeechCore) — https://console.groq.com |
| `IMAGERIE_*` | (Optionnel) Identifiants du module d'imagerie OncoVision — valeurs par défaut déjà présentes dans `docker-compose.yml`, à personnaliser uniquement si besoin |

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
| `PATHOCOLLAB_API_URL` | (Optionnel) URL de l'API PathoCollab — lames WSI exportées vers OncoVision |
| `PATHOCOLLAB_AUTH_URL` | (Optionnel) URL du service d'auth PathoCollab (compte de service) |
| `PATHOCOLLAB_SERVICE_EMAIL` / `PATHOCOLLAB_SERVICE_PASSWORD` | (Optionnel) Identifiants du compte de service PathoCollab |

> ℹ️ **PathoCollab** est une application externe, non incluse dans ce `docker-compose.yml`. Sans elle, tout fonctionne normalement — seule l'intégration des lames PathoCollab dans OncoVision (module imagerie) sera indisponible.
>
> ℹ️ **Éditeur de workflows** : le backend est déjà câblé (`WORKFLOW_ORCHESTRATOR_URL`) pour joindre un orchestrateur tournant nativement sur l'hôte, port `9092` (via `host.docker.internal`, pas dans Docker). C'est une application séparée fournie par l'équipe ; sans elle, tout le reste fonctionne normalement — seule la fonctionnalité d'édition de workflows sera indisponible.

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

#### `olga-designer/.env.front` — Olga Designer / Admin (Vite)
| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | URL de l'API Olga, accessible depuis le navigateur (`http://localhost:9091` par défaut) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Doivent être identiques à `.env.backend` |
| `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_PASSWORD` | Doivent être identiques à `.env` / `.env.backend` |

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

> ⚠️ Le service `ollama-init` télécharge le modèle `mistral:7b-q4` (LLM utilisé par SpeechCore) au tout premier démarrage — cela peut prendre plusieurs minutes supplémentaires selon la connexion. Le modèle est ensuite conservé dans le volume `ollama_data`.

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
| Pipeline Python (rapports Whisper/Gemini) | http://localhost:8003 |
| Olga Designer | http://localhost:8082 |
| Olga Admin | http://localhost:8083 |
| SpeechCore — API WebSocket (transcription temps réel) | ws://localhost:8000 |
| SpeechCore — API Complétion (formulaires) | http://localhost:8001 |
| Ollama (LLM Mistral pour SpeechCore) | http://localhost:11434 |
| Imagerie REST — OncoVision | http://localhost:8010 |
| Imagerie App — OncoVision | http://localhost:5174 |
| Imagerie MinIO — Console | http://localhost:9001 |

---

## 🔌 Documentation API complète

OncoCollab expose une **API REST + WebSocket** entièrement découplée, permettant à une application tierce de l'intégrer sans utiliser l'interface web.

### 🔐 Authentification

Tous les endpoints (sauf `/reports/file/:filename`) nécessitent un JWT dans le header :
```
Authorization: Bearer <your_jwt_token>
```

#### Login
```
POST http://localhost:3002/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}

Response 200:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { "id": "uuid", "email": "..." }
}
```

#### Profil
```
GET http://localhost:3002/auth/profile
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "email": "doctor@example.com",
  "doctorID": "uuid",
  "firstname": "Jean",
  "lastname": "Dupont"
}
```

---

### 👨‍⚕️ Médecins

#### Liste
```
GET http://localhost:3002/doctors
Authorization: Bearer <token>

Response 200: [{ doctorid, firstname, lastname, email, rolename, profile_image_url }, ...]
```

#### Créer
```
POST http://localhost:3002/doctors
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new.doctor@example.com",
  "firstname": "Marie",
  "lastname": "Martin",
  "speciality": "Oncologue"
}
```

---

### 👤 Patients

#### Liste
```
GET http://localhost:3002/patients
Authorization: Bearer <token>

Response 200: [{ patientid, patient_number, firstname, lastname, date_of_birth }, ...]
```

#### Créer
```
POST http://localhost:3002/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_number": "PA-002",
  "firstname": "Isabelle",
  "lastname": "Lefevre",
  "date_of_birth": "1955-03-22"
}
```

---

### 📅 Réunions (RCP)

#### Liste
```
GET http://localhost:3002/meetings
Authorization: Bearer <token>

Response 200: [{ id, title, description, start_time, status, created_by }, ...]
```

#### Créer
```
POST http://localhost:3002/meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "RCP Cardiologie",
  "description": "Révision des cas critiques",
  "start_time": "2026-05-20T15:30:00Z",
  "patient_ids": ["uuid-patient-1", "uuid-patient-2"]
}
```

#### Ajouter un participant
```
POST http://localhost:3002/meetings/:id/participants
Authorization: Bearer <token>
Content-Type: application/json

{ "doctor_id": "uuid-doctor" }
```

#### Lier une room OncoVision (annotation collaborative d'imagerie)
```
PATCH http://localhost:3002/meetings/:id/oncovision-room
Authorization: Bearer <token>
Content-Type: application/json

{ "oncovisionRoomId": "room-uuid" }

Response 200: { id, oncovision_room_id, ... }

⚠️ Accessible à tout participant de la réunion (pas réservé à l'organisateur) :
n'importe quel participant peut être le premier à ouvrir l'onglet Imagerie.
```

---

### 🧬 PathoCollab (intégration lames WSI)

#### Obtenir un token PathoCollab (pour le frontend)
```
GET http://localhost:3002/pathocollab/token
Authorization: Bearer <token>

Response 200: { "access_token": "..." }

ℹ️ Le backend obtient ce token côté serveur (compte de service) pour contourner
le CORS de l'auth-service PathoCollab. Nécessite PATHOCOLLAB_* dans .env.backend
(voir Étape 2) et une instance PathoCollab accessible — sinon endpoint indisponible.
```

---

### 📋 Prérequis

#### Mes prérequis (tous mes RCP)
```
GET http://localhost:3002/prerequisites/me
Authorization: Bearer <token>

Response 200:
[
  {
    "meeting_id": "uuid",
    "meeting_title": "RCP Cardiologie",
    "prerequisites": [
      {
        "id": "biopsie",
        "label": "Résultat biopsie",
        "status": "pending | in_progress | done",
        "completed": false
      }
    ]
  }
]
```

#### Prérequis d'une réunion
```
GET http://localhost:3002/prerequisites/meeting/:meetingId
Authorization: Bearer <token>

Response 200:
{
  "meeting_id": "uuid",
  "status": "in_progress | ready",
  "doctors": [
    {
      "doctor_id": "uuid",
      "items": [{ "key", "label", "status", "progress" }],
      "progress": { "completed": 2, "total": 3, "percentage": 66 }
    }
  ]
}
```

#### Mettre à jour un prérequis
```
PATCH http://localhost:3002/prerequisites/meeting/:meetingId
Authorization: Bearer <token>
Content-Type: application/json

{ "itemId": "biopsie", "completed": true }
```

---

### 📊 Rapports — LES ENDPOINTS CLÉS

#### Étape 1 : Transcription (Whisper)
```
POST http://localhost:3002/meetings/:meetingId/transcribe
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "audio": [.webm audio file]

Response 200:
{
  "success": true,
  "transcription": "Texte transcrit...",
  "language": "fr",
  "segments": [...]
}
```

#### Étape 2 : Générer rapport depuis transcription
```
POST http://localhost:3002/meetings/:meetingId/generate-from-transcript
Authorization: Bearer <token>
Content-Type: application/json

{
  "transcription": "Texte validé par l'utilisateur...",
  "language": "fr"
}

Response 200:
{
  "success": true,
  "reportId": "uuid",
  "pdfUrl": "https://... OR /reports/file/rcp_xxx.pdf",
  "title": "Compte-rendu RCP",
  "summary": "Résumé généré par Gemini...",
  "structuredData": {
    "summary": "...",
    "patients_discussed": [...],
    "decisions": [...]
  },
  "participantsNotified": 3
}
```

#### Pipeline complet : Audio → Rapport (1 appel)
```
POST http://localhost:3002/meetings/:meetingId/generate-report
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "audio": [.webm audio file]

Response 200: (même que Étape 2)
```

#### Récupérer détail d'un rapport
```
GET http://localhost:3002/reports/:reportId
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "meetingId": "uuid",
  "title": "Compte-rendu RCP",
  "summary": "...",
  "pdfUrl": "https://...",
  "pdfFilename": "rcp_xxx.pdf",
  "pdfSizeBytes": 245678,
  "generatedBy": "uuid-doctor",
  "generatedAt": "2026-05-15T14:30:00Z",
  "structuredData": {...}
}
```

#### Lister rapports d'une réunion
```
GET http://localhost:3002/meetings/:meetingId/reports
Authorization: Bearer <token>

Response 200: [{ id, title, summary, pdf_url, status, generated_at }, ...]
```

#### Mes rapports (espace personnel)
```
GET http://localhost:3002/doctors/reports/list
Authorization: Bearer <token>

Response 200: [{ id, meeting_id, title, summary, pdf_url, status, generated_at }, ...]
```

#### Recherche sémantique dans les rapports
```
GET http://localhost:3002/reports/search/semantic?query=biopsie&limit=10
Authorization: Bearer <token>

Response 200:
[
  {
    "reportId": "uuid",
    "score": 0.87,
    "title": "RCP du 15 mai",
    "summary": "...",
    "participants": ["uuid-doctor-1", "uuid-doctor-2"],
    "generatedAt": "2026-05-15T14:30:00Z"
  }
]
```

#### Servir le PDF (fallback local)
```
GET http://localhost:3002/reports/file/:filename

Response: [application/pdf binary]

⚠️ Pas d'authentification (nom = UUID v4 impossible à deviner)
```

---

### 💬 Messages & Chat

#### Envoyer un message
```
POST http://localhost:3002/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message de chat",
  "roomId": "uuid",
  "meetingId": "uuid"
}
```

#### Lister messages
```
GET http://localhost:3002/rooms/:roomId/messages
Authorization: Bearer <token>

Response 200: [{ id, content, senderId, senderName, createdAt }, ...]
```

---

### 📂 Espace Personnel (Documents)

#### Lister mes documents
```
GET http://localhost:3002/personal-files
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "reportId": "uuid",
    "fileName": "rcp_meeting_001.pdf",
    "fileUrl": "https://...",
    "fileSize": 245678,
    "fileType": "pdf",
    "isRead": false,
    "createdAt": "2026-05-15T14:30:00Z"
  }
]
```

#### Marquer comme lu
```
PATCH http://localhost:3002/personal-files/:id/read
Authorization: Bearer <token>

Response 200: { "success": true, "id": "uuid", "isRead": true }
```

#### Supprimer
```
DELETE http://localhost:3002/personal-files/:id
Authorization: Bearer <token>

Response 200: { "success": true }
```

#### Compter non lus
```
GET http://localhost:3002/personal-files/unread-count
Authorization: Bearer <token>

Response 200: { "count": 3 }
```

---

### 🎥 Vidéoconférence (WebSocket)

**Connexion :**
```
ws://localhost:3002
Header: { token: "<your_jwt_token>" }
```

#### Client → Serveur (emit)

**Rejoindre une room**
```javascript
socket.emit('join-room', {
  roomId: "uuid-meeting",
  micEnabled: true,
  videoEnabled: true
})
```

**Envoyer offre WebRTC**
```javascript
socket.emit('sending-offer', {
  offer: RTCSessionDescriptionInit,
  toId: "socket-id-recipient"
})
```

**Envoyer réponse WebRTC**
```javascript
socket.emit('sending-answer', {
  answer: RTCSessionDescriptionInit,
  toId: "socket-id-offeror"
})
```

**Envoyer candidat ICE**
```javascript
socket.emit('sending-ice-candidate', {
  candidate: RTCIceCandidateInit,
  toId: "socket-id-other-peer"
})
```

**Mettre à jour statut média**
```javascript
socket.emit('media-status-change', {
  roomId: "uuid-meeting",
  micEnabled: true,
  videoEnabled: false
})
```

**Envoyer message chat**
```javascript
socket.emit('send-chat-message', {
  content: "Coucou !",
  roomId: "uuid-meeting"
})
```

#### Serveur → Client (on)

**Configuration ICE (STUN/TURN)**
```javascript
socket.on('ice-config', (iceServers) => {
  // Passer à RTCPeerConnection({ iceServers })
})
```

**Utilisateurs existants**
```javascript
socket.on('get-existing-users', (participants) => {
  // [{ socketId, doctorId, firstName, lastName, avatarUrl, ... }]
})
```

**Nouvel utilisateur rejoint**
```javascript
socket.on('user-joined', (participant) => {
  // { socketId, doctorId, firstName, lastName, ... }
})
```

**Utilisateur parti**
```javascript
socket.on('user-left', (socketId) => { })
```

**Recevoir offre WebRTC**
```javascript
socket.on('receiving-offer', (offer, fromSocketId) => {
  // createAnswer()
})
```

**Recevoir réponse WebRTC**
```javascript
socket.on('receiving-answer', (answer, fromSocketId) => { })
```

**Recevoir candidat ICE**
```javascript
socket.on('receiving-ice-candidate', (candidate, fromSocketId) => {
  // peerConnection.addIceCandidate(candidate)
})
```

**Statut média changé**
```javascript
socket.on('media-status-changed', (payload) => {
  // { socketId, doctorId, micEnabled, videoEnabled, timestamp }
})
```

**Recevoir message chat**
```javascript
socket.on('receive-chat-message', (message) => {
  // { id, content, senderId, messageType, createdAt }
})
```

**Rapport généré (notification)**
```javascript
socket.on('report:ready', (reportData) => {
  // {
  //   reportId, meetingId, title, summary, pdfUrl,
  //   participantIds, generatedBy, generatedAt
  // }
})
```

**Prérequis mis à jour**
```javascript
socket.on('prerequisite-updated', (payload) => {
  // { meeting_id, doctor_id, key, status }
})
```

---

### ⚙️ Documents & Fichiers

#### Lister
```
GET http://localhost:3002/documents
Authorization: Bearer <token>

Response 200: [{ id, name, patient_id, document_type, file_url, uploaded_by, created_at }, ...]
```

#### Upload
```
POST http://localhost:3002/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "file": [document file]
Field "patient_id": "uuid-patient"
Field "document_type": "imaging | lab_result | prescription"

Response 201: { id, name, file_url, file_size }
```

---

### 🔐 Codes d'erreur HTTP

| Code | Signification |
|---|---|
| `200` | ✅ Succès |
| `201` | ✅ Créé |
| `400` | ❌ Mauvaise requête |
| `401` | ❌ Non authentifié (JWT manquant/invalide) |
| `403` | ❌ Non autorisé (pas de permission) |
| `404` | ❌ Ressource introuvable |
| `500` | ❌ Erreur serveur |

---

### 📌 Exemple d'intégration tierce

Une application externe peut intégrer OncoCollab de cette façon :

```javascript
// 1. Login et récupérer JWT
const response = await fetch('http://localhost:3002/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'password123'
  })
});

const { access_token } = await response.json();
const token = access_token;

// 2. Créer une réunion
const meetingRes = await fetch('http://localhost:3002/meetings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'RCP Cardiologie',
    description: 'Cas critiques',
    start_time: new Date().toISOString(),
    patient_ids: []
  })
});

const meeting = await meetingRes.json();

// 3. Enregistrer audio et générer un rapport
const audioBlob = /* ... audio du microphone ... */;
const formData = new FormData();
formData.append('audio', audioBlob, 'meeting.webm');

const reportRes = await fetch(`http://localhost:3002/meetings/${meeting.id}/generate-report`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const report = await reportRes.json();
console.log('Rapport généré :', report.pdfUrl);

// 4. Rejoindre la visioconférence (WebSocket)
const socket = io('ws://localhost:3002', {
  auth: { token }
});

socket.emit('join-room', { roomId: meeting.id });

socket.on('user-joined', (participant) => {
  console.log('Participant entré :', participant.firstName);
});
```

---

## Base de données PostgreSQL

Le schéma est initialisé automatiquement au premier démarrage via `data/postgres/init.sql`.

Ce script crée :
- Les tables principales : `roles`, `doctors`, `patients`, `rooms`, `meetings` (avec `oncovision_room_id`), `messages`, `meeting_participants`, `meeting_patients`, `meeting_date_options`, `meeting_date_votes`, `prise_en_charge_patient`, `medical_images`, `status`, `users`
- Les tables de rapports/transcriptions : `meeting_transcripts`, `meeting_reports`, `doctor_personal_files`, `transcription_blocks`
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
    ├── .env.front.example          ← copier en .env.front et remplir
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
