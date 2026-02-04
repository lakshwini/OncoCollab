# Guide d'utilisation du Module Vidéo OncoCollab

Ce guide explique comment utiliser le nouveau module vidéo modulaire avec support HTTPS/WSS pour les visioconférences sécurisées.

## 📁 Architecture du Module Vidéo

### Backend (rest-api)

```
rest-api/src/video/
├── video.module.ts      # Module NestJS principal
├── video.service.ts     # Service de gestion des rooms et participants
├── video.gateway.ts     # Gateway WebSocket pour signalisation WebRTC
└── index.ts            # Exports du module
```

### Frontend (src)

```
src/
├── services/
│   ├── video.service.ts    # Service réutilisable pour WebRTC
│   └── index.ts
├── config/
│   └── api.config.ts       # Configuration API avec support HTTPS/WSS
└── components/
    └── VideoConferenceAdvanced.tsx  # Composant de visioconférence
```

## 🔐 Configuration HTTPS/WSS

### 1. Générer les certificats SSL (si nécessaire)

Si vous n'avez pas encore les certificats `localhost+2.pem` et `localhost+2-key.pem`, installez [mkcert](https://github.com/FiloSottile/mkcert) :

```bash
# Installation de mkcert (macOS)
brew install mkcert
mkcert -install

# Générer les certificats
cd /chemin/vers/OncoCollab
mkcert localhost 127.0.0.1 ::1
```

Les certificats doivent être placés à la racine du projet :
- `localhost+2.pem` (certificat)
- `localhost+2-key.pem` (clé privée)

### 2. Configuration Backend

Modifier `rest-api/.env` :

```env
# Activer HTTPS
USE_HTTPS=true

# Configuration JWT
JWT_SECRET=votre-secret-jwt-tres-securise

# Port du serveur
PORT=3002

# Configuration PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=votre_utilisateur
POSTGRES_PASSWORD=votre_mot_de_passe
POSTGRES_DB=OncoCollab
```

### 3. Configuration Frontend

Modifier `.env` à la racine :

```env
# Activer HTTPS/WSS
VITE_USE_HTTPS=true

# URLs du backend (seront automatiquement converties en https/wss)
VITE_API_URL=https://localhost:3002
VITE_WS_URL=https://localhost:3002
```

## 🚀 Utilisation du Service Vidéo

### Exemple d'intégration basique

```typescript
import { VideoService, VideoServiceConfig } from '@/services/video.service';

// Configuration du service
const config: VideoServiceConfig = {
  authToken: 'votre-jwt-token',
  roomId: 'room-unique-id',

  // Callbacks
  onStreamAdded: (peerId, stream) => {
    console.log('Nouveau stream:', peerId);
    // Ajouter le stream à votre interface
  },

  onStreamRemoved: (peerId) => {
    console.log('Stream supprimé:', peerId);
    // Retirer le stream de votre interface
  },

  onChatMessage: ({ content, senderId, timestamp }) => {
    console.log('Nouveau message:', content);
    // Ajouter le message au chat
  },

  onConnectionStatusChange: (status) => {
    console.log('Statut:', status);
    // Mettre à jour l'interface
  }
};

// Créer le service
const videoService = new VideoService(config);

// Obtenir le stream local (caméra + micro)
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// Se connecter à la room
await videoService.connect(localStream);

// Envoyer un message dans le chat
videoService.sendChatMessage('Bonjour !', 'mon-user-id');

// Déconnexion
videoService.disconnect();
```

### Intégration dans un composant React

```typescript
import { useEffect, useRef, useState } from 'react';
import { VideoService } from '@/services/video.service';

function VideoConference({ authToken, roomId }) {
  const videoServiceRef = useRef<VideoService | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initVideo = async () => {
      // Créer le service
      const service = new VideoService({
        authToken,
        roomId,
        onStreamAdded: (peerId, stream) => {
          setRemoteStreams(prev => new Map(prev).set(peerId, stream));
        },
        onStreamRemoved: (peerId) => {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(peerId);
            return newMap;
          });
        },
      });

      // Obtenir le stream local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      // Connecter
      await service.connect(stream);
      videoServiceRef.current = service;
    };

    initVideo();

    return () => {
      videoServiceRef.current?.disconnect();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [authToken, roomId]);

  return (
    <div>
      {/* Vidéo locale */}
      <video autoPlay muted ref={(video) => {
        if (video && localStream) video.srcObject = localStream;
      }} />

      {/* Vidéos distantes */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <video key={peerId} autoPlay ref={(video) => {
          if (video) video.srcObject = stream;
        }} />
      ))}
    </div>
  );
}
```

## 🏗️ Architecture Backend

### VideoModule

Le `VideoModule` est un module NestJS qui encapsule toute la logique vidéo :

```typescript
@Module({
  imports: [MessagesModule, RoomsModule, JwtModule],
  providers: [VideoGateway, VideoService],
  exports: [VideoService],
})
export class VideoModule {}
```

### VideoService

Gère la logique métier des rooms et participants :

```typescript
// Méthodes principales
videoService.addSocketToRoom(socketId, roomId)
videoService.removeSocketFromRoom(socketId)
videoService.getRoomParticipants(roomId)
videoService.getRoomStats(roomId)
videoService.getActiveRooms()
videoService.ensureRoomExists(roomId, name?)
```

### VideoGateway

Gère la signalisation WebRTC via WebSocket :

- ✅ Authentification JWT obligatoire
- ✅ Gestion des connexions/déconnexions
- ✅ Relai des offres/réponses SDP
- ✅ Relai des ICE candidates
- ✅ Chat intégré

**Événements supportés :**

**Client → Serveur :**
- `join-room` : Rejoindre une room
- `sending-offer` : Envoyer une offre SDP
- `sending-answer` : Envoyer une réponse SDP
- `sending-ice-candidate` : Envoyer un ICE candidate
- `send-chat-message` : Envoyer un message de chat

**Serveur → Client :**
- `get-existing-users` : Liste des utilisateurs dans la room
- `user-joined` : Nouvel utilisateur
- `user-left` : Utilisateur parti
- `receiving-offer` : Réception d'une offre SDP
- `receiving-answer` : Réception d'une réponse SDP
- `receiving-ice-candidate` : Réception d'un ICE candidate
- `receive-chat-message` : Réception d'un message de chat
- `message-history` : Historique des messages

## 🔧 Démarrage

### 1. Backend

```bash
cd rest-api

# Installer les dépendances
npm install

# Configurer .env avec USE_HTTPS=true
echo "USE_HTTPS=true" >> .env

# Lancer le serveur
npm run start:dev
```

Le serveur démarre sur `https://localhost:3002` (si HTTPS activé).

### 2. Frontend

```bash
# À la racine du projet
npm install

# Configurer .env avec VITE_USE_HTTPS=true
echo "VITE_USE_HTTPS=true" >> .env

# Lancer le dev server
npm run dev
```

## 🧪 Tests

### Test de connexion HTTPS

```bash
# Tester l'API
curl -k https://localhost:3002

# Tester avec authentification
curl -k -X POST https://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test WebSocket

Utilisez un client WebSocket comme [websocat](https://github.com/vi/websocat) :

```bash
websocat -k wss://localhost:3002 --header="Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Dépannage

### Erreur "Certificats HTTPS introuvables"

Vérifiez que les fichiers sont présents :
```bash
ls -la localhost+2*.pem
```

### Erreur de certificat dans le navigateur

Si vous utilisez des certificats auto-signés, acceptez l'exception de sécurité en visitant directement `https://localhost:3002` dans votre navigateur.

### WebSocket ne se connecte pas

1. Vérifiez que `USE_HTTPS=true` est défini dans `rest-api/.env`
2. Vérifiez que `VITE_USE_HTTPS=true` est défini dans `.env`
3. Vérifiez les logs du serveur pour voir les erreurs de connexion
4. Testez avec le protocole HTTP/WS d'abord pour isoler le problème

### Problème de CORS

Vérifiez la configuration CORS dans `rest-api/src/main.ts`. Par défaut, `origin: '*'` permet toutes les origines.

## 📚 Ressources

- [WebRTC Documentation](https://webrtc.org/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSocket](https://docs.nestjs.com/websockets/gateways)
- [mkcert](https://github.com/FiloSottile/mkcert)

## 🔄 Migration depuis l'ancien code

Si vous avez un composant utilisant directement Socket.IO, migrez vers le `VideoService` :

**Avant :**
```typescript
const socket = io(SERVER_URL);
socket.emit('join-room', roomId);
// ... logique WebRTC manuelle
```

**Après :**
```typescript
const videoService = new VideoService({ authToken, roomId, ... });
await videoService.connect(localStream);
// Le service gère tout automatiquement
```

## 📝 Notes importantes

- ⚠️ Les certificats auto-signés ne doivent être utilisés qu'en développement
- 🔒 Pour la production, utilisez des certificats valides (Let's Encrypt, etc.)
- 🧹 Pensez à appeler `disconnect()` pour libérer les ressources
- 💾 Les messages du chat sont sauvegardés automatiquement en base de données
- 🔑 L'authentification JWT est obligatoire pour toutes les connexions WebSocket
