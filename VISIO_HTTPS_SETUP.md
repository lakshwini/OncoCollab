# 🔒 Configuration de la Visioconférence avec HTTPS

## Vue d'ensemble

Ce guide explique comment utiliser la visioconférence sécurisée avec HTTPS dans OncoCollab. Le système utilise :
- **NestJS** pour le backend avec certificats SSL
- **Socket.IO** pour la signalisation WebRTC en temps réel
- **WebRTC** pour les flux vidéo peer-to-peer
- **React** pour l'interface utilisateur

## 🎯 Fonctionnalités

✅ Connexion HTTPS sécurisée avec certificats SSL
✅ Visioconférence en temps réel avec WebRTC
✅ Chat en temps réel avec historique des messages
✅ Système de prérequis pour les participants
✅ Partage de documents et d'imagerie médicale
✅ Gestion dynamique des rooms
✅ Configuration centralisée et dynamique

## 📋 Prérequis

1. **Node.js** version 18 ou supérieure
2. **PostgreSQL** pour la base de données
3. **Certificats SSL** (déjà présents : `localhost+2.pem` et `localhost+2-key.pem`)

## 🚀 Installation et Démarrage

### 1. Configuration Backend (API REST)

```bash
# Aller dans le dossier rest-api
cd rest-api

# Installer les dépendances
npm install

# Démarrer le serveur (avec HTTPS)
npm run start:dev
```

Le serveur démarrera sur **https://localhost:3001** avec les certificats SSL.

### 2. Configuration Frontend

```bash
# Retourner à la racine du projet
cd ..

# Installer les dépendances
npm install

# Démarrer le frontend
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173** (ou le port configuré).

## 🔧 Configuration

### Fichier `.env` (racine du projet)

```env
# Configuration Backend
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=laksh
POSTGRES_PASSWORD=laksh
POSTGRES_DB=OncoCollab

# Configuration Frontend - API Backend avec HTTPS
VITE_API_URL=https://localhost:3001
VITE_WS_URL=https://localhost:3001
```

### Configuration API (`src/config/api.config.ts`)

Le fichier de configuration centralisée permet de :
- Gérer les URLs de manière dynamique
- Configurer Socket.IO avec HTTPS
- Définir les serveurs ICE pour WebRTC
- Centraliser tous les endpoints de l'API

## 📡 Utilisation du Composant VideoConferenceAdvanced

### Props disponibles

```typescript
interface VideoConferenceAdvancedProps {
  onClose: () => void;              // Fonction de fermeture
  patientName?: string;             // Nom du patient (optionnel)
  meetingTitle?: string;            // Titre de la réunion (optionnel)
  authToken?: string | null;        // Token JWT pour l'authentification (optionnel)
  roomId?: string;                  // ID de la room WebSocket (optionnel, généré depuis meetingTitle si absent)
  serverUrl?: string;               // URL du serveur (optionnel, utilise la config par défaut)
}
```

### Exemple d'utilisation

```tsx
import { VideoConferenceAdvanced } from './components/VideoConferenceAdvanced';

function App() {
  const [showVideo, setShowVideo] = useState(false);
  const authToken = localStorage.getItem('authToken');

  return (
    <>
      <button onClick={() => setShowVideo(true)}>
        Démarrer la visio
      </button>

      {showVideo && (
        <VideoConferenceAdvanced
          onClose={() => setShowVideo(false)}
          patientName="Mme. Dupont"
          meetingTitle="RCP - Mme. Dupont"
          authToken={authToken}
          roomId="rcp-mme-dupont-2024"
        />
      )}
    </>
  );
}
```

### Room ID dynamique

Le `roomId` est maintenant dynamique :
- Si fourni via props : utilise la valeur fournie
- Sinon : généré automatiquement depuis `meetingTitle` (format : `rcp-mme-dupont`)

## 🔒 Certificats SSL

Les certificats sont situés à la racine du projet :
- **Clé privée** : `localhost+2-key.pem`
- **Certificat** : `localhost+2.pem`

### Générer de nouveaux certificats (si nécessaire)

Avec **mkcert** :
```bash
# Installer mkcert
brew install mkcert  # macOS
# ou suivre les instructions pour votre OS

# Créer une autorité de certification locale
mkcert -install

# Générer les certificats
mkcert localhost 127.0.0.1 ::1
```

## 🧪 Test de la Configuration

1. **Vérifier le serveur backend** :
   ```bash
   curl -k https://localhost:3001
   ```
   Vous devriez voir une réponse du serveur NestJS.

2. **Vérifier la connexion WebSocket** :
   Ouvrez la console du navigateur et vérifiez les logs :
   ```
   🔌 Initialisation de la connexion WebSocket...
   🌐 Serveur: https://localhost:3001
   ✅ Connecté au serveur WebSocket
   ```

3. **Tester la visioconférence** :
   - Ouvrez deux onglets du navigateur
   - Démarrez une visio dans chaque onglet avec le même `roomId`
   - Vous devriez voir les flux vidéo de chaque participant

## 🐛 Dépannage

### Erreur de certificat SSL dans le navigateur

Si vous obtenez une erreur de certificat :
1. Cliquez sur "Paramètres avancés"
2. Cliquez sur "Continuer vers localhost (non sécurisé)"
3. Ou installez `mkcert` et régénérez les certificats

### Caméra/microphone non accessible

1. Vérifiez les permissions du navigateur
2. Assurez-vous que votre caméra/micro n'est pas utilisé par une autre application
3. Utilisez le bouton "Recharger caméra" dans l'interface

### Connexion WebSocket échoue

1. Vérifiez que le serveur backend est démarré
2. Vérifiez que le port 3001 n'est pas utilisé par une autre application
3. Vérifiez les variables d'environnement dans `.env`

### Participants ne se voient pas

1. Vérifiez que les deux participants sont dans la même room (même `roomId`)
2. Vérifiez la console pour des erreurs WebRTC
3. Vérifiez que les serveurs STUN sont accessibles

## 📝 Architecture

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │
│   localhost:5173│
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Backend       │
│   NestJS        │
│   localhost:3001│
│   (HTTPS + WSS) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Socket.IO│ │PostgreSQL│
│ (WebRTC │ │ Database │
│Signaling)│ │          │
└─────────┘ └──────────┘
```

## 🔐 Sécurité

- ✅ HTTPS avec certificats SSL
- ✅ Authentification JWT (optionnelle)
- ✅ CORS configuré
- ✅ WebSocket sécurisé (WSS)
- ⚠️  En production, utilisez des certificats signés par une autorité reconnue
- ⚠️  Configurez `rejectUnauthorized: true` en production

## 📚 Ressources

- [NestJS WebSocket Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)
- [mkcert - Certificats locaux](https://github.com/FiloSottile/mkcert)

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez les logs du serveur et du client
2. Consultez ce guide de dépannage
3. Ouvrez une issue sur le dépôt du projet
