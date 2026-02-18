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

## 🛠 Stack technique

**Frontend :** React, TypeScript, Vite, Socket.io, WebRTC  
**Backend :** NestJS, TypeORM, Mongoose, Socket.io  
**Bases :** PostgreSQL, MongoDB  
**Auth :** Supabase (OTP), JWT  
**Infra :** mkcert (HTTPS)

