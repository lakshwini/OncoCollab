<div align="center">

# 🏥 OncoCollab

### Plateforme RCP (Réunion de Concertation Pluridisciplinaire) en Oncologie

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

*Une plateforme collaborative sécurisée pour faciliter les réunions médicales pluridisciplinaires en temps réel avec visioconférence intégrée, gestion de dossiers patients et suivi des prérequis.*

[📖 Documentation](#-table-des-matières) • [🚀 Installation rapide](#-installation-rapide) • [💡 Fonctionnalités](#-fonctionnalités-principales) • [🏗 Architecture](#-architecture-globale)

</div>

---

## 📑 Table des matières

- [📋 Présentation du projet](#-présentation-du-projet)
- [✨ Fonctionnalités principales](#-fonctionnalités-principales)
- [🏗 Architecture globale](#-architecture-globale)
- [🛠 Stack technique](#-stack-technique)
- [📦 Prérequis obligatoires](#-prérequis-obligatoires)
- [🚀 Installation rapide](#-installation-rapide)
- [⚙️ Installation détaillée étape par étape](#️-installation-détaillée-étape-par-étape)
  - [1. Cloner le projet](#1-cloner-le-projet)
  - [2. Configuration des variables d'environnement](#2-configuration-des-variables-denvironnement)
  - [3. Configuration de PostgreSQL](#3-configuration-de-postgresql)
  - [4. Configuration de MongoDB](#4-configuration-de-mongodb)
  - [5. Générer les certificats HTTPS](#5-générer-les-certificats-https)
  - [6. Lancer le serveur TURN (Docker)](#6-lancer-le-serveur-turn-docker)
  - [7. Lancer le backend NestJS](#7-lancer-le-backend-nestjs)
  - [8. Lancer le frontend React](#8-lancer-le-frontend-react)
- [🎥 Tester la visioconférence](#-tester-la-visioconférence)
- [📂 Structure du projet](#-structure-du-projet)
- [🌐 Endpoints API principaux](#-endpoints-api-principaux)
- [🔌 Événements WebSocket](#-événements-websocket)
- [🚨 Dépannage](#-dépannage)
- [🛠 Commandes utiles](#-commandes-utiles)
- [🔐 Sécurité](#-sécurité)
- [📚 Ressources et documentation](#-ressources-et-documentation)
- [👥 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 📋 Présentation du projet

**OncoCollab** est une plateforme web moderne et sécurisée conçue pour faciliter les **Réunions de Concertation Pluridisciplinaire (RCP)** en oncologie. Elle permet aux médecins de différentes spécialités (oncologues, radiologues, chirurgiens, pathologistes, généticiens) de collaborer en temps réel autour de dossiers patients complexes.

### 🎯 Objectifs

- **Centraliser** la gestion des dossiers patients et des réunions RCP
- **Faciliter** la collaboration en temps réel entre médecins
- **Sécuriser** les échanges médicaux (HTTPS, JWT, chiffrement)
- **Tracer** les prérequis et les responsabilités de chaque participant
- **Améliorer** la qualité et l'efficacité des décisions médicales

### 🌟 Cas d'usage

1. **Organisation de RCP** : Créer une réunion, inviter des participants, assigner des rôles
2. **Gestion des prérequis** : Chaque médecin prépare ses documents avant la réunion
3. **Visioconférence sécurisée** : Réunion en temps réel avec partage d'écran, chat et annotations
4. **Suivi post-RCP** : Synthèse, décisions, compte-rendu

---

## ✨ Fonctionnalités principales

### 🔐 Authentification & Sécurité
- **Authentification OTP par email** (Supabase)
- **Gestion JWT** avec refresh tokens
- **HTTPS/WSS** obligatoire pour les communications
- **Gestion des rôles** (Organisateur, Co-admin, Participant)
- **Upload sécurisé** de photos de profil (Supabase Storage)

### 👨‍⚕️ Gestion des médecins & patients
- **CRUD complet** des dossiers patients
- **Gestion des spécialités** médicales
- **Attribution automatique** des prérequis selon le rôle
- **Historique** des consultations et décisions

### 📅 Gestion des réunions RCP
- **Création de réunions** avec participants multiples
- **Sélection du patient** concerné
- **Attribution de rôles** (Organisateur, Co-admin, Participant)
- **Gestion des prérequis** par participant et par rôle
- **Statut des réunions** (Programmée, Complétée, Reportée)

### 📋 Système de prérequis intelligent
- **Prérequis automatiques** selon la spécialité (PostgreSQL + MongoDB)
- **Suivi de progression** en temps réel (0/5, 2/5, 5/5)
- **Section "Mes Prérequis"** : vue personnelle de mes tâches
- **Section "Prérequis RCP"** : vue globale pour les organisateurs
- **Indicateurs visuels** : 🔴 Non commencé, 🟠 En cours, 🟢 Terminé
- **Sources multiples** : documents, imagerie (Orthanc), analyses biologiques

### 🎥 Visioconférence WebRTC professionnelle
- **WebRTC peer-to-peer** avec serveur TURN (NAT traversal)
- **Écrans multiples** : grille ou mode focus
- **Contrôles** : micro, caméra, partage d'écran
- **Chat temps réel** intégré (WebSocket)
- **Fenêtre flottante** (Picture-in-Picture)
- **Affichage des prérequis** pendant la visio
- **Barre de progression** des prérequis en temps réel

### 📁 Gestion documentaire
- **Upload de documents** médicaux (PDF, DOCX, images)
- **Visualisation intégrée** des documents
- **Annotations** sur imagerie médicale
- **Historique** des modifications

### 💬 Communication temps réel
- **Chat WebSocket** dans la visio
- **Notifications** des événements importants
- **Synchronisation automatique** des prérequis

---

## 🏗 Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                      🌐 FRONTEND (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Dashboard  │  │   RCP Form   │  │  Visioconférence │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│         │                 │                   │              │
│         └─────────────────┴───────────────────┘              │
│                           │                                  │
│                    HTTPS / WSS (JWT)                         │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   🔧 BACKEND (NestJS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth Module │  │ Video Gateway│  │ Prerequisites    │  │
│  │  (Supabase)  │  │ (WebSocket)  │  │ Service          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                   │              │
│  ┌──────┴─────────────────┴───────────────────┴──────┐      │
│  │  Meetings │ Doctors │ Patients │ Rooms │ Roles   │      │
│  └───────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────┬────────────────────────┘
                        │             │
        ┌───────────────┘             └─────────────┐
        ▼                                           ▼
┌──────────────────┐                      ┌─────────────────┐
│  🐘 PostgreSQL   │                      │  🍃 MongoDB     │
│                  │                      │                 │
│  • meetings      │                      │  • prerequisites│
│  • doctors       │                      │  • progress     │
│  • patients      │                      │  • status       │
│  • roles         │                      │                 │
│  • participants  │                      │                 │
└──────────────────┘                      └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              🔐 INFRASTRUCTURE & SERVICES                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Supabase   │  │  TURN Server │  │   HTTPS/WSS      │  │
│  │   (Auth)     │  │   (Docker)   │  │   (mkcert)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────���──────────────────────────────────────┘
```

### 🔄 Flux de données simplifié

```
┌──────────┐  Auth OTP    ┌──────────┐  JWT Token  ┌──────────┐
│ Frontend │──────────────>│ Supabase │────────────>│ Backend  │
└──────────┘              └──────────┘              └──────────┘
     │                                                    │
     │                                                    │
     │  REST API (CRUD Meetings, Patients, Doctors)      │
     │<───────────────────────────────────────────────────│
     │                                                    │
     │  WebSocket (Video, Chat, Prerequisites)           │
     │<──────────────────────────────────────────────────>│
     │                                                    │
     │  WebRTC (Peer-to-Peer Video/Audio)                │
     │<──────────────────────────────────────────────────>│
          via TURN Server (NAT Traversal)
```

---

## 🛠 Stack technique

### 🎨 **Frontend**

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | ^18.3.1 | Framework UI |
| **TypeScript** | - | Typage statique |
| **Vite** | 6.3.5 | Build tool ultra-rapide |
| **Socket.io Client** | ^4.8.3 | WebSocket temps réel |
| **WebRTC API** | Native | Visioconférence P2P |
| **Radix UI** | ^1.x | Composants accessibles |
| **Lucide React** | ^0.487.0 | Icônes |
| **Supabase JS** | ^2.95.3 | Auth & Storage |
| **Recharts** | ^2.15.2 | Graphiques |

### ⚙️ **Backend**

| Technologie | Version | Usage |
|------------|---------|-------|
| **NestJS** | ^11.0.x | Framework backend |
| **TypeScript** | - | Typage statique |
| **TypeORM** | ^0.3.28 | ORM pour PostgreSQL |
| **Mongoose** | ^8.20.2 | ODM pour MongoDB |
| **Passport JWT** | ^4.0.1 | Stratégie d'auth |
| **Socket.io** | ^4.8.3 | WebSocket |
| **Argon2** | ^0.44.0 | Hash sécurisé des mots de passe |
| **Supabase JS** | ^2.95.3 | Auth & Storage |
| **Class Validator** | ^0.14.3 | Validation des DTOs |

### 💾 **Bases de données**

| Base | Usage |
|------|-------|
| **PostgreSQL** | Données structurées (doctors, patients, meetings, roles) |
| **MongoDB** | Prérequis dynamiques et progression |

### 🔐 **Authentification & Sécurité**

- **Supabase Auth** : OTP par email, gestion des sessions
- **JWT** : Tokens sécurisés avec expiration
- **HTTPS** : Certificats locaux (mkcert)
- **WSS** : WebSocket sécurisé

### 🐳 **Infrastructure**

- **Docker / Docker Compose** : TURN server (coturn)
- **TURN Server** : NAT traversal pour WebRTC
- **mkcert** : Certificats HTTPS locaux

---

## 📦 Prérequis obligatoires

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

| Outil | Version minimale | Vérification | Installation |
|-------|-----------------|--------------|--------------|
| **Node.js** | ≥ 20.0.0 | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 10.0.0 | `npm --version` | (inclus avec Node.js) |
| **Docker** | ≥ 20.x | `docker --version` | [docker.com](https://www.docker.com) |
| **Docker Compose** | ≥ 2.x | `docker compose version` | (inclus avec Docker Desktop) |
| **PostgreSQL** | ≥ 14 | `psql --version` | [postgresql.org](https://www.postgresql.org) |
| **MongoDB** | ≥ 6.0 | `mongod --version` | [mongodb.com](https://www.mongodb.com) |
| **mkcert** | Dernière | `mkcert --version` | [github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert) |

### 📝 Notes importantes

- **PostgreSQL** : Peut être installé localement ou via Docker
- **MongoDB** : Peut être local, Docker, ou MongoDB Atlas
- **mkcert** : Obligatoire pour HTTPS local (WebRTC nécessite HTTPS)
- **Compte Supabase** : Créer un projet gratuit sur [supabase.com](https://supabase.com)

---

## 🚀 Installation rapide

Pour les développeurs expérimentés qui veulent démarrer rapidement :

```bash
# 1. Cloner le projet
git clone https://github.com/lakshwini/OncoCollab.git
cd OncoCollab

# 2. Installer les dépendances
npm install
cd rest-api && npm install && cd ..

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer les certificats HTTPS
mkcert -install
mkcert localhost 127.0.0.1

# 5. Lancer PostgreSQL et MongoDB (Docker ou local)
docker compose up -d

# 6. Lancer le backend
cd rest-api && npm run start:dev

# 7. Lancer le frontend (dans un autre terminal)
cd .. && npm run dev
```

Rendez-vous sur **https://localhost:5173** 🎉

---

## ⚙️ Installation détaillée étape par étape

### 1. Cloner le projet

```bash
# HTTPS
git clone https://github.com/lakshwini/OncoCollab.git

# OU SSH
git clone git@github.com:lakshwini/OncoCollab.git

cd OncoCollab
```

---

### 2. Configuration des variables d'environnement

#### 📁 **Frontend : `.env` (racine du projet)**

Créez un fichier `.env` à la racine :

```bash
# Configuration Frontend - API Backend
VITE_API_URL=https://localhost:3002
VITE_WS_URL=wss://localhost:3002
VITE_USE_HTTPS=true

# ✅ Configuration Supabase (Auth + Storage)
SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service_admin

# TURN Server (Docker)
EXTERNAL_IP=votre_ip_publique
```

#### 📁 **Backend : `rest-api/.env`**

Créez un fichier `.env` dans le dossier `rest-api/` :

```bash
# Port du serveur
PORT=3002

# Activation HTTPS
USE_HTTPS=true

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=laksh
POSTGRES_PASSWORD=laksh
POSTGRES_DB=OncoCollab

# MongoDB
MONGODB_URI=mongodb://localhost:27017/oncocollab_prerequisites

# JWT Secret (générer une clé forte)
JWT_SECRET=votre_cle_secrete_ultra_forte_ici

# Supabase
SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
```

#### 🔑 **Où trouver les clés Supabase ?**

1. Aller sur [https://supabase.com](https://supabase.com)
2. Créer un projet (gratuit)
3. Aller dans **Project Settings** > **API**
4. Copier :
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY` (⚠️ Ne jamais exposer côté frontend !)

---

### 3. Configuration de PostgreSQL

#### Option A : Installation locale

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Télécharger depuis https://www.postgresql.org/download/windows/
```

#### Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer l'utilisateur et la base
CREATE USER laksh WITH PASSWORD 'laksh';
CREATE DATABASE "OncoCollab" OWNER laksh;
GRANT ALL PRIVILEGES ON DATABASE "OncoCollab" TO laksh;
\q
```

#### Importer le schéma

```bash
cd rest-api
psql -U laksh -d OncoCollab -f schema.sql
```

#### Option B : Docker

```bash
docker run -d \
  --name oncocollab-postgres \
  -e POSTGRES_USER=laksh \
  -e POSTGRES_PASSWORD=laksh \
  -e POSTGRES_DB=OncoCollab \
  -p 5432:5432 \
  postgres:14
```

---

### 4. Configuration de MongoDB

#### Option A : Installation locale

```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod

# Windows
# Télécharger depuis https://www.mongodb.com/try/download/community
```

#### Option B : Docker

```bash
docker run -d \
  --name oncocollab-mongodb \
  -p 27017:27017 \
  mongo:6.0
```

#### Option C : MongoDB Atlas (Cloud)

1. Créer un compte gratuit sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit
3. Récupérer l'URI de connexion :

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/oncocollab_prerequisites
```

4. Mettre à jour `MONGODB_URI` dans `rest-api/.env`

---

### 5. Générer les certificats HTTPS

WebRTC **nécessite HTTPS** pour accéder à la caméra et au microphone.

#### Installation de mkcert

```bash
# macOS (Homebrew)
brew install mkcert
brew install nss # pour Firefox

# Linux
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

# Windows (Chocolatey)
choco install mkcert
```

#### Générer les certificats

```bash
# Installer l'autorité de certification locale
mkcert -install

# Générer les certificats pour localhost
mkcert localhost 127.0.0.1 ::1

# Les fichiers générés doivent être à la racine du projet :
# - localhost+2.pem (certificat)
# - localhost+2-key.pem (clé privée)
```

#### ⚠️ Placement des certificats

Les certificats doivent être **à la racine du projet** (même niveau que `package.json`).

Le backend NestJS les recherche automatiquement :

```typescript
const certPath = path.join(__dirname, '../../localhost+2.pem');
const keyPath = path.join(__dirname, '../../localhost+2-key.pem');
```

---

### 6. Lancer le serveur TURN (Docker)

Le serveur TURN (coturn) permet de traverser les NATs et firewalls pour WebRTC.

#### Démarrer le serveur TURN

```bash
# Depuis la racine du projet
docker compose up -d

# Vérifier que le conteneur tourne
docker ps | grep coturn

# Voir les logs
docker logs coturn
```

#### Configuration ICE dans le frontend

Le frontend utilise automatiquement le serveur TURN configuré :

```typescript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:localhost:3478',
    username: 'admin',
    credential: 'password'
  }
];
```

#### 🌐 Tester en réseau externe

Si vous voulez tester depuis un autre appareil :

```bash
# 1. Récupérer votre IP publique
curl ifconfig.me

# 2. Mettre à jour .env
EXTERNAL_IP=votre_ip_publique

# 3. Redémarrer le serveur TURN
docker compose restart coturn
```

---

### 7. Lancer le backend NestJS

```bash
cd rest-api

# Installer les dépendances
npm install

# Lancer en mode développement (hot reload)
npm run start:dev
```

#### ✅ Vérifier que le backend fonctionne

Vous devriez voir dans le terminal :

```
✅ Serveur NestJS démarré avec succès !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 API REST:     https://localhost:3002
🔌 WebSocket:    wss://localhost:3002
📡 Auth:         https://localhost:3002/auth/login
📹 Video:        wss://localhost:3002
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Tester l'API

```bash
# Test de santé
curl -k https://localhost:3002

# Devrait retourner : "Hello World!"
```

---

### 8. Lancer le frontend React

**Dans un nouveau terminal** :

```bash
# Revenir à la racine du projet
cd ..

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

#### ✅ Vérifier que le frontend fonctionne

Ouvrir votre navigateur sur : **https://localhost:5173**

⚠️ **Navigateur recommandé** : Chrome ou Edge (meilleur support WebRTC)

---

## 🎥 Tester la visioconférence

### Scénario de test complet

#### 1️⃣ **Créer deux comptes**

- Utilisateur 1 : `dr.germain@hospital.fr` / `L@kshwini29`
- Utilisateur 2 : `dr.michel@hospital.fr` / `L@kshwini29`

#### 2️⃣ **Créer une réunion RCP**

En tant que `dr.germain` :

1. Aller dans **Réunions** → **Créer une RCP**
2. Sélectionner un patient
3. Inviter `dr.michel` comme participant
4. Attribuer les prérequis
5. Enregistrer

#### 3️⃣ **Rejoindre la visio**

- **Utilisateur 1** (dr.germain) : Rejoindre la réunion
- **Utilisateur 2** (dr.michel) : Rejoindre la même r��union (ouvrir un onglet en navigation privée)

#### 4️⃣ **Vérifier les fonctionnalités**

- ✅ Les deux vidéos s'affichent
- ✅ Le son fonctionne (activer/désactiver le micro)
- ✅ La caméra fonctionne (activer/désactiver)
- ✅ Le chat temps réel fonctionne
- ✅ Les prérequis s'affichent dans la barre latérale
- ✅ La fenêtre flottante (Picture-in-Picture) fonctionne
- ✅ Le partage d'écran fonctionne

---

## 📂 Structure du projet

```
OncoCollab/
│
├── 📁 src/                          # Frontend React
│   ├── components/                  # Composants React
│   │   ├── LoginPage.tsx            # Page de connexion
│   │   ├── DashboardAdvanced.tsx    # Dashboard principal
│   │   ├── RCPFormUnified.tsx       # Formulaire de création RCP
│   │   ├── VideoConferenceAdvanced.tsx  # Composant visioconférence
│   │   ├── PrerequisitesPanel.tsx   # Panneau des prérequis
│   │   ├── PatientDossiers.tsx      # Gestion des dossiers patients
│   │   └── Sidebar.tsx              # Menu de navigation
│   │
│   ├── services/                    # Services frontend
│   │   ├── auth.service.ts          # Service d'authentification
│   │   ├── prerequisites.service.ts # Service prérequis
│   │   └── api.service.ts           # Service API
│   │
│   ├── i18n/                        # Internationalisation
│   │   ├── translations.ts          # Traductions FR/EN
│   │   └── prerequisite-labels.ts   # Labels prérequis
│   │
│   ├── config/
│   │   └── api.config.ts            # Configuration API
│   │
│   └── lib/
│       └── supabase.ts              # Client Supabase
│
├── 📁 rest-api/                     # Backend NestJS
│   ├── src/
│   │   ├── auth/                    # Module d'authentification
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-ws.guard.ts      # Guard WebSocket
│   │   │
│   │   ├── doctors/                 # Module médecins
│   │   │   ├── doctors.controller.ts
│   │   │   ├── doctors.service.ts
│   │   │   └── doctor.entity.ts
│   │   │
│   │   ├── patients/                # Module patients
│   │   │   ├── patients.controller.ts
│   │   │   ├── patients.service.ts
│   │   │   └── patient.entity.ts
│   │   │
│   │   ├── meetings/                # Module réunions
│   │   │   ├── meetings.controller.ts
│   │   │   ├── meetings.service.ts
│   │   │   └── meeting.entity.ts
│   │   │
│   │   ├── prerequisites/           # Module prérequis
│   │   │   ├── prerequisites.controller.ts
│   │   │   ├── prerequisites.service.ts
│   │   │   └── prerequisite-templates.ts
│   │   │
│   │   ├── video/                   # Module vidéo WebSocket
│   │   │   ├── video.gateway.ts     # Gateway Socket.io
│   │   │   ├── video.service.ts
│   │   │   └── video.module.ts
│   │   │
│   │   ├── roles/                   # Module rôles
│   │   ├── rooms/                   # Module salles
│   │   ├── messages/                # Module messages
│   │   │
│   │   ├── scripts/
│   │   │   └── setup-prerequisites.ts  # Script d'initialisation
│   │   │
│   │   ├── app.module.ts            # Module principal
│   │   └── main.ts                  # Point d'entrée
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── 📁 build/                        # Build production frontend
├── 📁 node_modules/                 # Dépendances
│
├── 📄 .env                          # Variables d'environnement frontend
├── 📄 docker-compose.yml            # Configuration Docker (TURN)
├── 📄 package.json                  # Dépendances frontend
├── 📄 vite.config.ts                # Configuration Vite
├── 📄 index.html                    # Point d'entrée HTML
├── 🔒 localhost+2.pem               # Certificat HTTPS
├── 🔒 localhost+2-key.pem           # Clé privée HTTPS
│
└── 📄 README.md                     # Ce fichier 📖
```

---

## 🌐 Endpoints API principaux

### 🔐 **Authentification**

```http
POST   /auth/login                  # Connexion (email + password)
POST   /auth/logout                 # Déconnexion
GET    /auth/profile                # Profil utilisateur (JWT requis)
POST   /auth/refresh                # Rafraîchir le token
```

### 👨‍⚕️ **Médecins (Doctors)**

```http
GET    /doctors                     # Liste des médecins
GET    /doctors/:id                 # Détails d'un médecin
POST   /doctors                     # Créer un médecin
PUT    /doctors/:id                 # Modifier un médecin
DELETE /doctors/:id                 # Supprimer un médecin
POST   /doctors/:id/upload-photo    # Upload photo de profil
```

### 👤 **Patients**

```http
GET    /patients                    # Liste des patients
GET    /patients/:id                # Détails d'un patient
POST   /patients                    # Créer un patient
PUT    /patients/:id                # Modifier un patient
DELETE /patients/:id                # Supprimer un patient
GET    /patients/prise-en-charge/table  # Vue tableau des patients
```

### 📅 **Réunions (Meetings)**

```http
GET    /meetings                    # Liste des réunions
GET    /meetings/:id                # Détails d'une réunion
POST   /meetings                    # Créer une réunion
PUT    /meetings/:id                # Modifier une réunion
DELETE /meetings/:id                # Supprimer une réunion
GET    /meetings/:id/participants   # Participants d'une réunion
POST   /meetings/:id/participants   # Ajouter un participant
```

### 📋 **Prérequis**

```http
GET    /prerequisites/my                      # Mes prérequis (JWT)
GET    /prerequisites/meeting/:id             # Prérequis d'une réunion
GET    /prerequisites/meeting/:id/details     # Détails par participant
PATCH  /prerequisites/meeting/:id             # Mettre à jour un prérequis
POST   /prerequisites/initialize              # Initialiser les prérequis
```

### 🏷 **Rôles & Spécialités**

```http
GET    /roles                       # Liste des rôles médicaux
GET    /roles/:id                   # Détails d'un rôle
```

### 🏠 **Rooms (Salles de visio)**

```http
GET    /rooms                       # Liste des rooms actives
POST   /rooms                       # Créer une room
DELETE /rooms/:id                   # Supprimer une room
```

---

## 🔌 Événements WebSocket

Le système utilise **Socket.io** pour les communications temps réel (vidéo + chat + prérequis).

### 📹 **Événements vidéo**

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `join-room` | Client → Server | Rejoindre une salle de visio |
| `leave-room` | Client → Server | Quitter une salle |
| `user-joined` | Server → Client | Notification : nouvel utilisateur |
| `user-left` | Server → Client | Notification : utilisateur parti |
| `sending-offer` | Client → Server | Offre SDP WebRTC |
| `offer-received` | Server → Client | Réception offre |
| `sending-answer` | Client → Server | Réponse SDP WebRTC |
| `answer-received` | Server → Client | Réception réponse |
| `sending-ice-candidate` | Client → Server | Candidat ICE |
| `ice-candidate-received` | Server → Client | Réception candidat ICE |
| `media-update` | Client → Server | Mise à jour média (micro/caméra) |
| `user-media-updated` | Server → Client | Notification changement média |

### 💬 **Événements chat**

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `send-message` | Client → Server | Envoyer un message |
| `receive-message` | Server → Client | Recevoir un message |
| `typing` | Client → Server | Utilisateur en train d'écrire |
| `user-typing` | Server → Client | Notification typing |

### 📋 **Événements prérequis**

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `prerequisite-updated` | Server → Client | Prérequis mis à jour |
| `progress-changed` | Server → Client | Progression changée |

### 🔌 **Connexion WebSocket depuis le frontend**

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://localhost:3002', {
  auth: {
    token: localStorage.getItem('onco_collab_token')
  },
  transports: ['websocket']
});

// Rejoindre une salle
socket.emit('join-room', {
  roomId: 'meeting-123',
  userId: 'doctor-456',
  userName: 'Dr. Martin'
});

// Écouter les nouveaux utilisateurs
socket.on('user-joined', (data) => {
  console.log('Nouvel utilisateur :', data);
});
```

---

## 🚨 Dépannage

### ❌ **Problème : WebRTC ne connecte pas**

**Symptôme** : Les vidéos ne s'affichent pas, connexion échoue.

**Solutions** :

1. Vérifier que HTTPS est activé :
   ```bash
   # Dans rest-api/.env
   USE_HTTPS=true
   
   # Dans .env (racine)
   VITE_USE_HTTPS=true
   ```

2. Vérifier que les certificats existent :
   ```bash
   ls -la localhost+2*.pem
   ```

3. Vérifier que le serveur TURN fonctionne :
   ```bash
   docker logs coturn
   ```

4. Tester la connectivité TURN :
   - Aller sur [https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
   - Ajouter : `turn:localhost:3478` (username: `admin`, password: `password`)
   - Cliquer sur "Gather candidates"
   - Vérifier qu'il y a des candidats de type `relay`

---

### ❌ **Problème : Caméra ou micro ne marche pas**

**Solutions** :

1. Autoriser l'accès dans le navigateur :
   - Chrome : Cliquer sur l'icône 🔒 dans la barre d'adresse
   - Autoriser "Caméra" et "Microphone"

2. Vérifier que HTTPS est activé (obligatoire pour WebRTC)

3. Tester la caméra :
   ```javascript
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => console.log('OK:', stream))
     .catch(err => console.error('Erreur:', err));
   ```

---

### ❌ **Problème : MongoDB erreur de connexion**

**Symptôme** :
```
MongoServerError: Authentication failed
```

**Solutions** :

1. Vérifier que MongoDB est démarré :
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   
   # Docker
   docker ps | grep mongo
   ```

2. Vérifier l'URI dans `rest-api/.env` :
   ```bash
   MONGODB_URI=mongodb://localhost:27017/oncocollab_prerequisites
   ```

3. Si MongoDB Atlas :
   - Vérifier que l'IP est autorisée (0.0.0.0/0 pour tous)
   - Vérifier le username/password dans l'URI

---

### ❌ **Problème : PostgreSQL erreur de connexion**

**Symptôme** :
```
error: password authentication failed for user "laksh"
```

**Solutions** :

1. Vérifier que PostgreSQL est démarré :
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   
   # Docker
   docker ps | grep postgres
   ```

2. Tester la connexion :
   ```bash
   psql -U laksh -d OncoCollab
   ```

3. Vérifier les credentials dans `rest-api/.env`

---

### ❌ **Problème : Supabase OTP ne marche pas**

**Symptôme** : Pas de mail reçu après connexion.

**Solutions** :

1. Vérifier la configuration Supabase :
   - Aller dans **Authentication** > **Email Templates**
   - Vérifier que "Confirm signup" est activé

2. Vérifier le SMTP (si configuré) :
   - Aller dans **Project Settings** > **Auth**
   - Vérifier le serveur SMTP

3. Mode test : utiliser un email jetable comme [temp-mail.org](https://temp-mail.org)

---

### ❌ **Problème : Room supprimée automatiquement**

**Symptôme** : La room se ferme quand un utilisateur quitte.

**Cause** : Logique du backend qui supprime la room si elle est vide.

**Solution** : Modifier `rest-api/src/video/video.gateway.ts` :

```typescript
// AVANT (mauvais)
if (room.participants.length === 0) {
  this.rooms.delete(roomId);
}

// APRÈS (correct)
if (room.participants.length === 0 && room.meeting_ended) {
  this.rooms.delete(roomId);
}
```

---

### ❌ **Problème : TURN server ne répond pas**

**Symptôme** : WebRTC fonctionne en local mais pas depuis l'extérieur.

**Solutions** :

1. Vérifier que le serveur TURN est accessible :
   ```bash
   # Tester le port TURN
   nc -zv localhost 3478
   ```

2. Ouvrir les ports dans le firewall :
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3478/tcp
   sudo ufw allow 3478/udp
   sudo ufw allow 50000:50020/udp
   ```

3. Configurer l'IP externe :
   ```bash
   # Dans .env
   EXTERNAL_IP=$(curl ifconfig.me)
   
   # Redémarrer le serveur TURN
   docker compose restart coturn
   ```

---

## 🛠 Commandes utiles

### 🐳 **Docker**

```bash
# Voir les conteneurs actifs
docker ps

# Voir tous les conteneurs (même arrêtés)
docker ps -a

# Voir les logs d'un conteneur
docker logs coturn
docker logs -f coturn  # mode suivi

# Redémarrer un conteneur
docker restart coturn

# Arrêter tous les conteneurs
docker compose down

# Supprimer les volumes (⚠️ supprime les données)
docker compose down -v

# Reconstruire les images
docker compose build --no-cache
```

### 💾 **PostgreSQL**

```bash
# Se connecter à la base
psql -U laksh -d OncoCollab

# Lister les tables
\dt

# Voir la structure d'une table
\d doctors

# Exécuter une requête
SELECT * FROM doctors;

# Sauvegarder la base
pg_dump -U laksh OncoCollab > backup.sql

# Restaurer la base
psql -U laksh OncoCollab < backup.sql
```

### 🍃 **MongoDB**

```bash
# Se connecter à MongoDB
mongosh

# Sélectionner la base
use oncocollab_prerequisites

# Lister les collections
show collections

# Voir les documents
db.meeting_prerequisites.find().pretty()

# Compter les documents
db.meeting_prerequisites.countDocuments()

# Supprimer tous les documents d'une collection
db.meeting_prerequisites.deleteMany({})
```

### 🔄 **Git**

```bash
# Voir l'état des fichiers
git status

# Voir l'historique
git log --oneline --graph

# Annuler les modifications non commitées
git reset --hard

# Changer de branche
git checkout main

# Mettre à jour depuis GitHub
git pull origin main

# Créer une branche
git checkout -b feature/ma-fonctionnalite
```

### 📦 **npm**

```bash
# Installer les dépendances
npm install

# Nettoyer le cache
npm cache clean --force

# Réinstaller depuis zéro
rm -rf node_modules package-lock.json
npm install

# Mettre à jour les dépendances
npm update

# Vérifier les dépendances obsolètes
npm outdated
```

---

## 🔐 Sécurité

### ✅ **Bonnes pratiques implémentées**

- ✅ **HTTPS obligatoire** pour toutes les communications
- ✅ **JWT avec expiration** (access token + refresh token)
- ✅ **Hash des mots de passe** avec Argon2 (plus sécurisé que bcrypt)
- ✅ **CORS configuré** (origin, credentials, methods)
- ✅ **Validation des DTOs** (class-validator)
- ✅ **Guards NestJS** (JWT strategy)
- ✅ **WebSocket authentifié** (JWT dans handshake)
- ✅ **Variables d'environnement** (.env ignoré dans .gitignore)

### ⚠️ **Avertissements de sécurité**

#### 🔴 **NE JAMAIS faire en production**

1. ❌ **Ne jamais commiter les fichiers `.env`**
   ```bash
   # Vérifier que .env est dans .gitignore
   cat .gitignore | grep .env
   ```

2. ❌ **Ne jamais exposer `SUPABASE_SERVICE_KEY` côté frontend**
   - Utiliser uniquement côté backend
   - Garder `SUPABASE_ANON_KEY` pour le frontend

3. ❌ **Ne jamais désactiver HTTPS en production**
   ```bash
   # ❌ MAUVAIS
   USE_HTTPS=false
   
   # ✅ BON
   USE_HTTPS=true
   ```

4. ❌ **Ne jamais utiliser `CORS origin: '*'` en production**
   ```typescript
   // ❌ MAUVAIS
   app.enableCors({ origin: '*' });
   
   // ✅ BON
   app.enableCors({ 
     origin: ['https://monsite.com'],
     credentials: true 
   });
   ```

#### 🔧 **Configuration pour la production**

```bash
# Variables d'environnement PRODUCTION
NODE_ENV=production
USE_HTTPS=true
JWT_SECRET=$(openssl rand -base64 64)  # Générer une clé forte
CORS_ORIGIN=https://monsite.com
```

---

## 📚 Ressources et documentation

### 📖 **Documentation officielle**

- [React](https://react.dev/)
- [NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Mongoose](https://mongoosejs.com/)
- [WebRTC](https://webrtc.org/)
- [Socket.io](https://socket.io/docs/)
- [Supabase](https://supabase.com/docs)

### 🎓 **Tutoriels utiles**

- [WebRTC pour les débutants](https://webrtc.org/getting-started/overview)
- [NestJS WebSocket](https://docs.nestjs.com/websockets/gateways)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [MongoDB](https://www.mongodb.com/docs/)

### 🛠 **Outils de développement**

- [Postman](https://www.postman.com/) - Tester les APIs
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Interface MongoDB
- [pgAdmin](https://www.pgadmin.org/) - Interface PostgreSQL
- [WebRTC Troubleshooter](https://test.webrtc.org/) - Tester WebRTC

---

## 👥 Contribution

Les contributions sont les bienvenues ! 🎉

### 🔄 **Comment contribuer**

1. **Fork** le projet
2. **Créer une branche** :
   ```bash
   git checkout -b feature/ma-super-fonctionnalite
   ```
3. **Commit** les changements :
   ```bash
   git commit -m "✨ Ajout de ma super fonctionnalité"
   ```
4. **Push** vers la branche :
   ```bash
   git push origin feature/ma-super-fonctionnalite
   ```
5. **Ouvrir une Pull Request** sur GitHub

### 📝 **Convention de commits**

Utiliser les préfixes suivants :

- ✨ `feat:` - Nouvelle fonctionnalité
- 🐛 `fix:` - Correction de bug
- 📚 `docs:` - Documentation
- 💄 `style:` - Formatage, CSS
- ♻️ `refactor:` - Refactoring
- ✅ `test:` - Tests
- 🔧 `chore:` - Maintenance

Exemple :
```bash
git commit -m "✨ feat: ajout du partage d'écran dans la visio"
```

---

## 📄 Licence

Ce projet est sous licence **MIT**.

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) pour le framework backend
- [React](https://react.dev/) pour le framework frontend
- [Supabase](https://supabase.com/) pour l'authentification
- [WebRTC](https://webrtc.org/) pour la visioconférence
- [Radix UI](https://www.radix-ui.com/) pour les composants UI
- [mkcert](https://github.com/FiloSottile/mkcert) pour les certificats HTTPS locaux

---

<div align="center">

### 💙 Fait avec passion pour améliorer les soins en oncologie

**OncoCollab** © 2026

[⬆ Retour en haut](#-oncocollab)

</div>
