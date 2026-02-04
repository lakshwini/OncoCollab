# 🚀 Guide de Test Rapide - Visioconférence HTTPS

## Test en 5 Minutes

### ⚡ Démarrage Rapide

```bash
# Terminal 1 - Backend
cd rest-api
npm install
npm run start:dev

# Terminal 2 - Frontend
cd ..
npm install
npm run dev
```

### ✅ Checklist de Vérification

#### 1. Backend démarré correctement
Dans le terminal du backend, vérifiez que vous voyez :
```
✅ Certificats SSL chargés avec succès
✅ Serveur lancé sur https://localhost:3001
🔌 WebSocket disponible sur https://localhost:3001
```

#### 2. Frontend accessible
Ouvrez votre navigateur à : `http://localhost:5173`

#### 3. Accéder à la visioconférence
- Naviguez vers la section RCP Meetings ou Patients
- Cliquez sur "Démarrer une RCP" ou "Rejoindre la visio"

#### 4. Vérifier la connexion HTTPS
Dans la console du navigateur (F12), vous devriez voir :
```
🔌 Initialisation de la connexion WebSocket...
🌐 Serveur: https://localhost:3001
🚪 Room ID: rcp-mme-dupont
Connecté au serveur WebSocket
```

Dans le footer de la visio, vérifiez :
- 🟢 Point vert = Connecté
- 🔒 HTTPS = Connexion sécurisée
- Room: [nom-de-la-room]
- Participants: X

#### 5. Tester la caméra/microphone
- Autorisez l'accès à la caméra et au microphone quand demandé
- Votre vidéo devrait apparaître dans la fenêtre locale
- Indicateur "Local stream: ✅" dans le footer

#### 6. Test multi-utilisateurs
1. **Ouvrir un second onglet** (ou utiliser un autre navigateur)
2. **Rejoindre la même room** (même titre de réunion ou même roomId)
3. **Vérifier** :
   - Les deux participants se voient
   - Le compteur de participants affiche "2 participants"
   - Le chat fonctionne entre les deux onglets

---

## 🐛 Problèmes Courants et Solutions

### ❌ "Certificats SSL manquants"
**Symptôme** : Le serveur démarre en HTTP au lieu de HTTPS

**Solution** :
```bash
# Vérifier que les certificats existent à la racine
ls -la localhost+2*.pem

# Si absents, les générer avec mkcert
brew install mkcert  # macOS
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

### ❌ "WebSocket connection failed"
**Symptôme** : Erreur de connexion WebSocket dans la console

**Solutions** :
1. Vérifier que le backend est démarré
2. Vérifier que le port 3001 est disponible :
   ```bash
   lsof -i :3001
   ```
3. Vérifier le fichier `.env` contient :
   ```env
   VITE_WS_URL=https://localhost:3001
   ```

### ❌ "Caméra/Microphone non accessible"
**Symptôme** : Pas de vidéo locale ou erreur "Permission denied"

**Solutions** :
1. Cliquer sur l'icône de caméra dans la barre d'URL du navigateur
2. Autoriser l'accès à la caméra et au microphone
3. Recharger la page
4. Utiliser le bouton "Recharger caméra" dans l'interface

### ❌ "Les participants ne se voient pas"
**Symptôme** : Connectés mais pas de vidéo distante

**Solutions** :
1. Vérifier que les deux utilisateurs sont dans la **même room**
2. Vérifier la console pour des erreurs WebRTC
3. Vérifier que les serveurs STUN sont accessibles :
   ```bash
   # Test de connectivité
   ping stun.l.google.com
   ```

### ❌ "Certificate error" dans le navigateur
**Symptôme** : Avertissement de sécurité sur https://localhost:3001

**Solution** :
1. Cliquer sur "Paramètres avancés"
2. Cliquer sur "Continuer vers localhost (non sécurisé)"
3. Ou installer mkcert et régénérer les certificats

---

## 🧪 Tests Fonctionnels

### Test 1 : Chat en Temps Réel
1. Ouvrir deux onglets avec la même room
2. Envoyer un message depuis l'onglet 1
3. ✅ Le message apparaît dans l'onglet 2

### Test 2 : Affichage des Prérequis
1. Ouvrir l'onglet "Participants" dans la sidebar
2. Cliquer sur un participant
3. ✅ La carte des prérequis s'affiche avec :
   - Statut de complétion (%)
   - Liste des tâches
   - Badges de statut

### Test 3 : Partage de Documents
1. Ouvrir l'onglet "Documents" dans la sidebar
2. ✅ Liste des documents partagés visible
3. ✅ Boutons de téléchargement fonctionnels

### Test 4 : Imagerie Médicale
1. Basculer entre "Imagerie" et "Vidéo" avec le bouton en bas
2. ✅ La vue change sans perdre la connexion
3. ✅ Les outils d'annotation sont visibles en mode Imagerie

### Test 5 : Reconnexion Automatique
1. Démarrer une visio
2. Arrêter le serveur backend (`Ctrl+C` dans le terminal)
3. Attendre quelques secondes
4. Redémarrer le serveur (`npm run start:dev`)
5. ✅ La connexion se rétablit automatiquement
6. ✅ L'indicateur passe de 🔴 à 🟢

---

## 📊 Métriques de Performance

### Temps de Connexion Normal
- Connexion WebSocket : < 500ms
- Premier frame vidéo : < 2s
- Établissement peer-to-peer : < 3s

### Latence Acceptable
- Chat : < 100ms
- Vidéo : < 200ms
- Audio : < 150ms

Si les métriques sont supérieures, vérifier :
- La charge CPU/RAM du serveur
- La connexion réseau
- Le nombre de participants (optimisé pour 2-6 participants)

---

## 🔍 Logs à Surveiller

### Logs Backend (Terminal 1)
```
[CONNEXION] Nouvel utilisateur: <socket-id>
[ROOM] <socket-id> rejoint la room <room-id>
[ROOM] Utilisateurs actifs dans <room-id>: [...]
[SIGNALING] Offer reçue de <id> à destination de <id>
[SIGNALING] Réponse reçue de <id> à <id>
[SIGNALING] ICE Candidate reçu de <id> à destination de <id>
[CHAT] Message de <user> dans room <room>: <message>
```

### Logs Frontend (Console Navigateur)
```
🔌 Initialisation de la connexion WebSocket...
🌐 Serveur: https://localhost:3001
🚪 Room ID: rcp-mme-dupont
Connecté au serveur WebSocket <socket-id>
Rejoint la room: rcp-mme-dupont
Utilisateurs existants: [...]
📹 Demande d'accès aux médias...
✅ Stream obtenu avec tracks: [{kind: "audio", enabled: true}, {kind: "video", enabled: true}]
Création RTCPeerConnection avec <user-id>
Track reçu de <user-id>
ICE connection state pour <user-id>: connected
```

---

## ✨ Fonctionnalités à Tester

### ✅ Core Features
- [x] Connexion HTTPS sécurisée
- [x] Établissement WebRTC peer-to-peer
- [x] Vidéo en temps réel
- [x] Audio en temps réel
- [x] Chat avec historique
- [x] Multi-participants (2+)

### ✅ UI Features
- [x] Contrôles micro/caméra
- [x] Affichage des participants
- [x] Système de prérequis
- [x] Partage de documents
- [x] Basculement Imagerie/Vidéo
- [x] Outils d'annotation (mode Imagerie)

### ✅ Advanced Features
- [x] Reconnexion automatique
- [x] Gestion des déconnexions
- [x] Indicateurs de statut en temps réel
- [x] Room ID dynamique
- [x] Configuration centralisée

---

## 📝 Checklist Finale

Avant de considérer le test comme réussi, vérifiez :

- [ ] Backend démarre avec HTTPS
- [ ] Frontend se connecte au backend
- [ ] Caméra et microphone fonctionnent
- [ ] Deux onglets peuvent se connecter à la même room
- [ ] Les participants se voient mutuellement
- [ ] Le chat fonctionne entre participants
- [ ] Les prérequis s'affichent correctement
- [ ] Les documents sont listés
- [ ] Le mode Imagerie s'affiche
- [ ] La reconnexion fonctionne
- [ ] Aucune erreur dans les consoles
- [ ] L'indicateur 🔒 HTTPS est visible

---

## 🎉 Succès !

Si tous les tests passent, félicitations ! Votre système de visioconférence HTTPS est opérationnel.

Pour aller plus loin :
- Consultez [VISIO_HTTPS_SETUP.md](./VISIO_HTTPS_SETUP.md) pour la documentation complète
- Lisez [CHANGELOG_VISIO_HTTPS.md](./CHANGELOG_VISIO_HTTPS.md) pour comprendre les modifications
- Testez avec plus de participants (3-6) pour vérifier la scalabilité

---

**Temps estimé du test complet** : 5-10 minutes
**Dernière mise à jour** : 2026-01-30
