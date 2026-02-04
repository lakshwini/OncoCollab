# 🚀 Démarrage Rapide - Visioconférence HTTPS

## ⚡ EN 2 MINUTES

### Étape 1 : Démarrer le serveur backend

```bash
# Ouvrir un terminal dans rest-api
cd rest-api

# Démarrer le serveur (il va utiliser HTTPS automatiquement)
npm run start:dev
```

**✅ Vérifiez que vous voyez :**
```
✅ Certificats SSL chargés avec succès
✅ Serveur lancé sur https://localhost:3001
🔌 WebSocket disponible sur https://localhost:3001
```

### Étape 2 : Démarrer le frontend

```bash
# Ouvrir un NOUVEAU terminal à la racine
cd ..

# Démarrer le frontend
npm run dev
```

### Étape 3 : Tester la visio

1. Ouvrir le navigateur : `http://localhost:5173`
2. Aller dans "RCP Meetings" ou "Patients"
3. Cliquer sur "Démarrer une RCP"
4. **Autoriser l'accès à la caméra et au microphone**
5. Vérifier l'indicateur en haut à droite : 🟢 **Connexion sécurisée**

---

## 🐛 Problème "Déconnecté" ?

Si vous voyez **🔴 Déconnecté** en haut :

### Solution 1 : Vérifier que le serveur tourne

```bash
# Dans le terminal rest-api, vérifiez que vous voyez bien :
✅ Serveur lancé sur https://localhost:3001
```

Si vous ne voyez PAS ce message, le serveur n'est pas démarré !

### Solution 2 : Vérifier le port 3001

```bash
# Vérifier si le port 3001 est occupé
lsof -i :3001

# Si occupé par un autre process, le tuer :
kill -9 <PID>

# Puis redémarrer le serveur
cd rest-api
npm run start:dev
```

### Solution 3 : Vérifier les variables d'environnement

Le fichier `.env` à la racine doit contenir :
```env
VITE_API_URL=https://localhost:3001
VITE_WS_URL=https://localhost:3001
```

**Si modifié, REDÉMARRER le frontend :**
```bash
# Ctrl+C dans le terminal du frontend
npm run dev
```

---

## ✅ Nouveautés - Interface Style Teams/Zoom

### 🎨 Nouvelle Interface

- ✅ **Grille adaptative** : S'adapte automatiquement au nombre de participants
- ✅ **Contrôles visuels** : Boutons ronds avec labels comme Teams/Zoom
- ✅ **Indicateurs de statut** : 🟢 Connexion sécurisée / 🔴 Déconnecté
- ✅ **Overlays vidéo** : Noms des participants sur les vidéos
- ✅ **Animations** : Transitions fluides et effets hover

### 🎛️ Contrôles qui Marchent VRAIMENT

**Micro** :
- Cliquer sur le bouton micro → Coupe **instantanément** l'audio
- Le track audio est désactivé en temps réel
- Les autres participants ne vous entendent plus immédiatement

**Caméra** :
- Cliquer sur le bouton caméra → Coupe **instantanément** la vidéo
- Le track vidéo est désactivé en temps réel
- Les autres participants voient votre avatar au lieu de la vidéo

### 🔄 Mode Imagerie

- Bouton en bas à gauche : "Mode Vidéo" / "Mode Imagerie"
- Bascule entre l'affichage des examens médicaux et la vidéo
- **Fonctionne sans couper la connexion WebRTC**

---

## 🧪 Test Multi-Utilisateurs

### Méthode 1 : Deux onglets du même navigateur

1. Ouvrir la visio dans l'onglet 1
2. Copier l'URL ou noter le "Room ID"
3. Ouvrir un nouvel onglet
4. Démarrer une visio avec le même "Room ID"
5. **Vous devriez vous voir dans les deux onglets !**

### Méthode 2 : Deux navigateurs différents

1. Chrome : Ouvrir la visio
2. Firefox : Ouvrir la visio avec le même Room ID
3. Les deux navigateurs se voient

---

## 📊 Indicateurs à Surveiller

### En Haut (Header)

- **🟢 Connexion sécurisée** = Tout va bien
- **🔴 Déconnecté** = Le serveur n'est pas joignable
- **X participants** = Nombre total dans la room (vous inclus)
- **Room: nom-de-room** = ID de la room actuelle

### En Bas (Contrôles)

Chaque bouton a maintenant un **label** dessous :
- **Micro** / **Muet**
- **Caméra** / **Arrêtée**
- **Partager**
- **Chat**
- **Quitter**

---

## 🔍 Logs à Vérifier

### Console du Navigateur (F12)

```
✅ BON :
🔌 Initialisation de la connexion WebSocket...
🌐 Serveur: https://localhost:3001
Connecté au serveur WebSocket <votre-id>
✅ Stream obtenu avec tracks

❌ MAUVAIS :
WebSocket connection failed
ECONNREFUSED
```

### Terminal Backend

```
✅ BON :
[CONNEXION] Nouvel utilisateur: <socket-id>
[ROOM] <socket-id> rejoint la room <room-id>

❌ MAUVAIS :
(rien ne s'affiche quand vous rejoignez = serveur pas démarré)
```

---

## 🎯 Checklist Rapide

Avant de dire "ça ne marche pas", vérifiez :

- [ ] Le serveur backend est démarré (`npm run start:dev` dans rest-api)
- [ ] Vous voyez "✅ Serveur lancé sur https://localhost:3001"
- [ ] Le frontend est démarré (`npm run dev` à la racine)
- [ ] Vous avez autorisé la caméra et le microphone dans le navigateur
- [ ] L'indicateur en haut affiche 🟢 "Connexion sécurisée"
- [ ] La console ne montre pas d'erreurs rouges
- [ ] Vous voyez votre vidéo dans la grille

---

## 💡 Astuces

### Recharger les médias

Si votre caméra/micro ne fonctionne pas :
1. Cliquer sur le bouton **"Recharger"** en bas à droite
2. Autoriser à nouveau l'accès si demandé

### Changer de caméra

Pour l'instant, l'app utilise la caméra par défaut. Pour changer :
1. Fermer la visio
2. Aller dans les paramètres du navigateur
3. Changer la caméra par défaut
4. Rouvrir la visio

### Tester sans caméra

Si vous n'avez pas de caméra :
1. La visio fonctionne quand même !
2. Vous verrez votre avatar à la place
3. Les autres participants aussi

---

## 📞 Toujours des problèmes ?

### Erreur de certificat SSL

Si le navigateur affiche une erreur de certificat pour `https://localhost:3001` :

1. Cliquer sur "Paramètres avancés"
2. Cliquer sur "Continuer vers localhost (non sécurisé)"
3. Ou installer `mkcert` :
   ```bash
   brew install mkcert
   mkcert -install
   cd /path/to/project
   mkcert localhost 127.0.0.1 ::1
   ```

### Reset complet

Si vraiment rien ne marche :

```bash
# Arrêter tout (Ctrl+C dans les deux terminaux)

# Backend
cd rest-api
npm install
npm run start:dev

# Frontend (nouveau terminal)
cd ..
npm install
npm run dev

# Vider le cache du navigateur (Ctrl+Shift+Del)
# Rouvrir la page
```

---

**Temps estimé : 2-3 minutes**
**Dernière mise à jour : 2026-01-30**

🎉 **Profitez de votre visioconférence sécurisée style Teams/Zoom !**
