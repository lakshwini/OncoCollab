# 🏥 OncoCollab

### Plateforme RCP (Réunion de Concertation Pluridisciplinaire) en Oncologie

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)

*Plateforme collaborative sécurisée pour les réunions médicales pluridisciplinaires en temps réel*

---

## ✨ Fonctionnalités

- 🔐 Authentification Supabase (OTP email)
- 👥 Gestion des médecins, patients et réunions
- 📋 Système de prérequis par spécialité (PostgreSQL + MongoDB)
- 🎥 Visioconférence WebRTC avec serveur TURN
- 💬 Chat temps réel (WebSocket)
- 📂 Upload de documents et imagerie médicale
- 🔒 HTTPS obligatoire pour la sécurité

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

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/lakshwini/OncoCollab.git
cd OncoCollab
```

### 2️⃣ Variables d'environnement

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
POSTGRES_USER=laksh
POSTGRES_PASSWORD=laksh
POSTGRES_DB=OncoCollab

MONGODB_URI=mongodb://localhost:27017/oncocollab_prerequisites

JWT_SECRET=generer_une_cle_secrete_forte

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

## 🔌 Endpoints principaux

### Authentification
```
POST   /auth/login           # Connexion
GET    /auth/profile         # Profil (JWT requis)
```

### Médecins
```
GET    /doctors              # Liste des médecins
POST   /doctors              # Créer un médecin
```

### Patients
```
GET    /patients             # Liste des patients
POST   /patients             # Créer un patient
```

### Réunions
```
GET    /meetings             # Liste des réunions
POST   /meetings             # Créer une réunion
```

### Prérequis
```
GET    /prerequisites/my                # Mes prérequis
GET    /prerequisites/meeting/:id       # Prérequis d'une réunion
PATCH  /prerequisites/meeting/:id       # Mettre à jour
```

---

## 🚨 Dépannage

### WebRTC ne fonctionne pas
- ✅ Vérifier que HTTPS est activé (`USE_HTTPS=true`)
- ✅ Vérifier que les certificats sont bien à la racine
- ✅ Autoriser la caméra/micro dans le navigateur

### Erreur de connexion base de données
- ✅ Vérifier que PostgreSQL et MongoDB sont démarrés
- ✅ Vérifier les credentials dans les fichiers `.env`

---

## 🛠 Stack technique

**Frontend :** React, TypeScript, Vite, Socket.io, WebRTC  
**Backend :** NestJS, TypeORM, Mongoose, Socket.io  
**Bases :** PostgreSQL, MongoDB  
**Auth :** Supabase (OTP), JWT  
**Infra :** mkcert (HTTPS)

---

## 📄 Licence

MIT © 2026 OncoCollab

---

**Fait avec 💙 pour améliorer les soins en oncologie**