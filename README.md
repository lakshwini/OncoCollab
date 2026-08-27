# 🏥 OncoCollab

### Plateforme RCP (Réunion de Concertation Pluridisciplinaire) en Oncologie
*Plateforme collaborative sécurisée pour les réunions médicales pluridisciplinaires en temps réel*

---

## ✨ Fonctionnalités

- 🔐 Authentification Supabase (OTP email)
- 👥 Gestion des médecins, patients et réunions
- 📋 Système de prérequis par spécialité (PostgreSQL + MongoDB)
- 🎥 Visioconférence WebRTC avec serveur TURN
- 💬 Chat temps réel (WebSocket)
- 📂 Upload de documents et imagerie médicale


---

## 📦 Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| **Node.js** | ≥ 20.0.0 | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 10.0.0 | (inclus avec Node.js) |
| **PostgreSQL** | ≥ 14 | [postgresql.org](https://www.postgresql.org) |
| **MongoDB** | ≥ 6.0 | [mongodb.com](https://www.mongodb.com) |
| **mkcert** | Dernière | [github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert) |

### Compte Supabase
Créer un projet gratuit sur [supabase.com](https://supabase.com) et récupérer :
- `Project URL`
- `anon public key`
- `service_role key`

---

## 🚀 Installation


### 1️⃣ Variables d'environnement

**`.env` (racine du projet)**

```bash
VITE_API_URL=https://localhost:3002
VITE_WS_URL=wss://localhost:3002
VITE_USE_HTTPS=true

SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service
```

**`rest-api/.env`**

```bash
PORT=3002
USE_HTTPS=true

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=''
POSTGRES_PASSWORD=''
POSTGRES_DB=OncoCollab

MONGODB_URI=mongodb://localhost:27017/oncocollab_prerequisites

JWT_SECRET=generer_une_cle

SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
```

### 3️⃣ Générer les certificats HTTPS

```bash
# Installer mkcert
brew install mkcert          # macOS
choco install mkcert         # Windows

# Générer les certificats (à la racine du projet)
mkcert -install
mkcert localhost 127.0.0.1
```

### 4️⃣ Installer et lancer

```bash
# Installer les dépendances
npm install
cd rest-api && npm install && cd ..

# Terminal 1 : Backend
cd rest-api && npm run start:dev

# Terminal 2 : Frontend
npm run dev
```

Ouvrir **https://localhost:5173** 🎉

---

## 📂 Structure du projet

```
OncoCollab/
├── src/                     # Frontend React
│   ├── components/          # Composants UI
│   ├── services/            # Services API
│   └── i18n/                # Traductions FR/EN
│
├── rest-api/                # Backend NestJS
│   └── src/
│       ├── auth/            # Authentification JWT
│       ├── doctors/         # Module médecins
│       ├── patients/        # Module patients
│       ├── meetings/        # Module réunions
│       ├── prerequisites/   # Prérequis (MongoDB)
│       └── video/           # WebSocket + WebRTC
│
├── .env                     # Config frontend
├── localhost+2.pem          # Certificat HTTPS
└── README.md
```

---

## 🏗 Architecture

```
Frontend (React)
      ↓
   HTTPS/WSS (JWT)
      ↓
Backend (NestJS)
      ↓
   ┌──────┴──────┐
   ↓             ↓
PostgreSQL    MongoDB
(Structure)   (Prérequis)
```

**Services externes :**
- Supabase : Authentification OTP
- TURN Server : NAT traversal pour WebRTC

---

## 🔌 Endpoints API complets

> **⚠️ Tous les endpoints (sauf `/reports/file/:filename`) nécessitent un JWT dans le header :**
> ```
> Authorization: Bearer <your_jwt_token>
> ```

### 🔐 Authentification

#### Login
```
POST /auth/login
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
GET /auth/profile
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

#### Liste des médecins
```
GET /doctors
Authorization: Bearer <token>

Response 200:
[
  {
    "doctorid": "uuid",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean@example.com",
    "rolename": "Cardiologue",
    "profile_image_url": "https://..."
  }
]
```

#### Créer un médecin
```
POST /doctors
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new.doctor@example.com",
  "firstname": "Marie",
  "lastname": "Martin",
  "speciality": "Oncologue"
}

Response 201:
{
  "doctorid": "uuid",
  "email": "new.doctor@example.com",
  "firstname": "Marie",
  "lastname": "Martin"
}
```

#### Détail d'un médecin
```
GET /doctors/:id
Authorization: Bearer <token>

Response 200:
{
  "doctorid": "uuid",
  "firstname": "Marie",
  "lastname": "Martin",
  "email": "marie@example.com"
}
```

---

### 👤 Patients

#### Liste des patients
```
GET /patients
Authorization: Bearer <token>

Response 200:
[
  {
    "patientid": "uuid",
    "patient_number": "PA-001",
    "firstname": "Pierre",
    "lastname": "Bernard",
    "date_of_birth": "1960-05-15"
  }
]
```

#### Créer un patient
```
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_number": "PA-002",
  "firstname": "Isabelle",
  "lastname": "Lefevre",
  "date_of_birth": "1955-03-22"
}

Response 201:
{
  "patientid": "uuid",
  "patient_number": "PA-002",
  "firstname": "Isabelle",
  "lastname": "Lefevre"
}
```

#### Détail d'un patient
```
GET /patients/:id
Authorization: Bearer <token>

Response 200:
{
  "patientid": "uuid",
  "patient_number": "PA-002",
  "firstname": "Isabelle",
  "lastname": "Lefevre",
  "date_of_birth": "1955-03-22"
}
```

---

### 📅 Réunions (RCP)

#### Liste des réunions
```
GET /meetings
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "title": "RCP Oncologie",
    "description": "Discussion cas patients",
    "start_time": "2026-05-15T14:00:00Z",
    "status": "scheduled",
    "created_by": "uuid-doctor"
  }
]
```

#### Créer une réunion
```
POST /meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "RCP Cardiologie",
  "description": "Révision des cas critiques",
  "start_time": "2026-05-20T15:30:00Z",
  "patient_ids": ["uuid-patient-1", "uuid-patient-2"]
}

Response 201:
{
  "id": "uuid",
  "title": "RCP Cardiologie",
  "status": "scheduled",
  "start_time": "2026-05-20T15:30:00Z"
}
```

#### Détail d'une réunion
```
GET /meetings/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "title": "RCP Cardiologie",
  "description": "Révision des cas",
  "status": "scheduled",
  "participants": [
    { "doctor_id": "uuid", "firstname": "Jean", "lastname": "Dupont" }
  ]
}
```

#### Ajouter un participant
```
POST /meetings/:id/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctor_id": "uuid-doctor"
}

Response 200:
{ "success": true }
```

---

### 📋 Prérequis (by RCP)

#### Mes prérequis (tous mes RCP)
```
GET /prerequisites/me
Authorization: Bearer <token>

Response 200:
[
  {
    "meeting_id": "uuid",
    "meeting_title": "RCP Cardiologie",
    "meeting_status": "scheduled",
    "speciality": "Cardiologue",
    "prerequisites": [
      {
        "id": "biopsie",
        "key": "biopsie",
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
GET /prerequisites/meeting/:meetingId
Authorization: Bearer <token>

Response 200:
{
  "meeting_id": "uuid",
  "status": "in_progress | ready",
  "doctors": [
    {
      "doctor_id": "uuid",
      "speciality": "Cardiologue",
      "items": [
        {
          "key": "imagerie",
          "label": "Imagerie médicale",
          "status": "done"
        }
      ],
      "progress": { "completed": 2, "total": 3, "percentage": 66 }
    }
  ]
}
```

#### Mettre à jour un prérequis
```
PATCH /prerequisites/meeting/:meetingId
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "biopsie",
  "completed": true
}

Response 200:
{ "success": true, "itemId": "biopsie", "completed": true }
```

#### Statut 3-états (pending, in_progress, done)
```
PATCH /prerequisites/meeting/:meetingId/item/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress"
}

Response 200:
{ "success": true, "itemId": "biopsie", "status": "in_progress" }
```

---

### 📊 Rapports (Génération + PDF)

#### Étape 1 : Transcription seule (Whisper)
```
POST /meetings/:meetingId/transcribe
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "audio": [.webm audio file]

Response 200:
{
  "success": true,
  "transcription": "Texte transcrit par Whisper...",
  "language": "fr",
  "segments": [...]
}
```

#### Étape 2 : Générer rapport depuis transcription
```
POST /meetings/:meetingId/generate-from-transcript
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
    "decisions": [...],
    "key_points": [...]
  },
  "participantsNotified": 3
}
```

#### Pipeline complet : Audio → Rapport en 1 appel
```
POST /meetings/:meetingId/generate-report
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "audio": [.webm audio file]

Response 200:
{
  "success": true,
  "reportId": "uuid",
  "pdfUrl": "https://...",
  "title": "Compte-rendu RCP",
  "summary": "...",
  "structuredData": {...},
  "participantsNotified": 3
}
```

#### Récupérer détail d'un rapport
```
GET /reports/:reportId
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "meetingId": "uuid",
  "title": "Compte-rendu RCP",
  "summary": "...",
  "status": "ready",
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
GET /meetings/:meetingId/reports
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "meeting_id": "uuid",
    "title": "Compte-rendu RCP",
    "summary": "...",
    "pdf_url": "https://...",
    "status": "ready",
    "generated_at": "2026-05-15T14:30:00Z"
  }
]
```

#### Mes rapports (espace personnel)
```
GET /doctors/reports/list
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "meeting_id": "uuid",
    "title": "RCP Cardiologie",
    "summary": "...",
    "pdf_url": "https://...",
    "status": "ready",
    "generated_at": "2026-05-15T14:30:00Z",
    "meeting_title": "RCP Cardiologie"
  }
]
```

#### Recherche sémantique dans les rapports
```
GET /reports/search/semantic?query=biopsie&limit=10
Authorization: Bearer <token>

Response 200:
[
  {
    "reportId": "uuid",
    "score": 0.87,
    "title": "RCP du 15 mai",
    "summary": "...",
    "participants": ["uuid-doctor-1", "uuid-doctor-2"],
    "generatedBy": "uuid-doctor",
    "generatedAt": "2026-05-15T14:30:00Z"
  }
]
```

#### Servir le PDF (fallback local, pas d'auth)
```
GET /reports/file/:filename

Response: [application/pdf binary]

⚠️ Aucune authentification requise (nom de fichier = UUID v4 impossible à deviner)
```

---

### 💬 Messages & Chat

#### Envoyer un message
```
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message de chat",
  "roomId": "uuid",
  "meetingId": "uuid"
}

Response 201:
{
  "id": "uuid",
  "content": "Message de chat",
  "senderId": "uuid-doctor",
  "createdAt": "2026-05-15T14:30:00Z"
}
```

#### Lister messages d'une room
```
GET /rooms/:roomId/messages
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "content": "Message",
    "senderId": "uuid-doctor",
    "senderName": "Jean Dupont",
    "createdAt": "2026-05-15T14:30:00Z"
  }
]
```

---

### 📂 Espace Personnel (Mes Documents)

#### Lister mes documents
```
GET /personal-files
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "doctorId": "uuid",
    "reportId": "uuid-rapport",
    "meetingId": "uuid",
    "fileName": "rcp_meeting_001.pdf",
    "fileUrl": "https://...",
    "fileSize": 245678,
    "fileType": "pdf",
    "isRead": false,
    "createdAt": "2026-05-15T14:30:00Z"
  }
]
```

#### Marquer document comme lu
```
PATCH /personal-files/:id/read
Authorization: Bearer <token>

Response 200:
{ "success": true, "id": "uuid", "isRead": true }
```

#### Supprimer un document de mon espace
```
DELETE /personal-files/:id
Authorization: Bearer <token>

Response 200:
{ "success": true }
```

#### Compter documents non lus
```
GET /personal-files/unread-count
Authorization: Bearer <token>

Response 200:
{ "count": 3 }
```

---

### 🎥 Vidéoconférence (WebSocket)

**Connexion :**
```
ws://localhost:3002
Header: { token: "<your_jwt_token>" }
```

#### Événements Client → Serveur

**Rejoindre une room**
```javascript
socket.emit('join-room', {
  roomId: "uuid-meeting",
  micEnabled: true,
  videoEnabled: true
})
```

**Envoyer offre WebRTC (SDP)**
```javascript
socket.emit('sending-offer', {
  offer: RTCSessionDescriptionInit,
  toId: "socket-id-recipient"
})
```

**Envoyer réponse WebRTC (SDP)**
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

#### Événements Serveur → Client

**Votre info (Self)**
```javascript
socket.on('self-info', (participantPayload) => {
  // {
  //   socketId: "...",
  //   doctorId: "...",
  //   firstName: "Jean",
  //   lastName: "Dupont",
  //   role: "organizer",
  //   speciality: "Cardiologue",
  //   avatarUrl: "...",
  //   micEnabled: true,
  //   videoEnabled: true
  // }
})
```

**Configuration ICE (STUN/TURN)**
```javascript
socket.on('ice-config', (iceServers) => {
  // { iceServers: [...] }
  // À passer à RTCPeerConnection({ iceServers })
})
```

**Utilisateurs déjà connectés**
```javascript
socket.on('get-existing-users', (participants) => {
  // [{ socketId, doctorId, firstName, ... }, ...]
})
```

**Nouvel utilisateur rejoint**
```javascript
socket.on('user-joined', (participant) => {
  // { socketId, doctorId, firstName, lastName, ... }
})
```

**Utilisateur quitté**
```javascript
socket.on('user-left', (socketId) => {
  // Retirer du rendu
})
```

**Recevoir offre WebRTC**
```javascript
socket.on('receiving-offer', (offer, fromSocketId) => {
  // Créer RTCPeerConnection et appeler createAnswer()
})
```

**Recevoir réponse WebRTC**
```javascript
socket.on('receiving-answer', (answer, fromSocketId) => {
  // Attacher la réponse à la peer connection
})
```

**Recevoir candidat ICE**
```javascript
socket.on('receiving-ice-candidate', (candidate, fromSocketId) => {
  // peerConnection.addIceCandidate(candidate)
})
```

**Changement statut média d'un participant**
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

**Historique des messages**
```javascript
socket.on('message-history', (messages) => {
  // [{ id, content, senderId, ... }, ...]
})
```

**Rapport généré (notification temps réel)**
```javascript
socket.on('report:ready', (reportData) => {
  // {
  //   reportId: "uuid",
  //   meetingId: "uuid",
  //   title: "RCP Cardiologie",
  //   summary: "...",
  //   pdfUrl: "https://...",
  //   participantIds: ["uuid-doc-1", "uuid-doc-2"],
  //   generatedBy: "uuid-doctor",
  //   generatedAt: "2026-05-15T14:30:00Z"
  // }
})
```

**Prérequis mis à jour en temps réel**
```javascript
socket.on('prerequisite-updated', (payload) => {
  // { meeting_id, doctor_id, key, status }
})
```

---

### ⚙️ Documents & Fichiers

#### Lister documents
```
GET /documents
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "name": "Imagerie.pdf",
    "patient_id": "uuid",
    "document_type": "imaging",
    "file_url": "https://...",
    "uploaded_by": "uuid-doctor",
    "created_at": "2026-05-15T14:30:00Z"
  }
]
```

#### Upload document
```
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field "file": [document file]
Field "patient_id": "uuid-patient"
Field "document_type": "imaging | lab_result | prescription"

Response 201:
{
  "id": "uuid",
  "name": "Imagerie.pdf",
  "file_url": "https://...",
  "file_size": 1234567
}
```

---

## 🔐 Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| `200` | ✅ Succès |
| `201` | ✅ Créé |
| `400` | ❌ Mauvaise requête (paramètres invalides) |
| `401` | ❌ Non authentifié (JWT manquant/invalide) |
| `403` | ❌ Non autorisé (pas de permission) |
| `404` | ❌ Ressource introuvable |
| `500` | ❌ Erreur serveur |

---

## 📌 Variables d'environnement Backend requises

```bash
# Application
PORT=3002
USE_HTTPS=true

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=oncocollab
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=oncocollab

# MongoDB
MONGODB_URI=mongodb://localhost:27017/oncocollab_prerequisites

# JWT
JWT_SECRET=your_secret_key_min_32_chars

# Supabase (optionnel)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Python Pipeline
PIPELINE_URL=http://python-pipeline:8000

# Olga
OLGA_BASE_URL=http://olga-api:9091

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# Rapports
LOCAL_REPORTS_DIR=/data/reports
SUPABASE_REPORTS_BUCKET=meeting-reports

# Gemini AI
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash

# Whisper
WHISPER_MODEL=base
```

---

## 🛠 Stack technique

**Frontend :** React, TypeScript, Vite, Socket.io, WebRTC  
**Backend :** NestJS, TypeORM, Mongoose, Socket.io  
**Bases :** PostgreSQL, MongoDB  
**Auth :** Supabase (OTP), JWT  
**Infra :** mkcert (HTTPS)

