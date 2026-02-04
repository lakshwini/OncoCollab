# Guide de Test - Authentification et Sessions

Ce guide vous permet de tester le système d'authentification complet avec les comptes réels de la base de données.

## Prérequis

1. **Base de données PostgreSQL** doit être démarrée avec les données de la table `doctors`
2. **Backend NestJS** doit être démarré sur le port 3001
3. **Frontend React** doit être démarré

## Démarrage du système

### 1. Démarrer la base de données
```bash
# Si vous utilisez PostgreSQL localement
# Assurez-vous que PostgreSQL est en cours d'exécution
```

### 2. Démarrer le backend
```bash
cd rest-api
npm install
npm run start:dev
```

Vous devriez voir :
```
[Nest] INFO  Application is listening on: https://localhost:3001
```

### 3. Démarrer le frontend
```bash
# À la racine du projet
npm install
npm run dev
```

Vous devriez voir :
```
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

## Comptes disponibles pour les tests

Voici les 5 comptes de médecins disponibles dans la base de données :

| Email | Prénom | Nom | Rôle | Mot de passe |
|-------|--------|-----|------|--------------|
| dr.germain@hospital.fr | Adrien | Germain | Oncologue Référent | L@kshwini29 |
| dr.michel@hospital.fr | Maggie | Michel | Radiologue | L@kshwini29 |
| dr.rivière@hospital.fr | Virginie | Rivière | Chirurgien Oncologue | L@kshwini29 |
| dr.clerc@hospital.fr | Virginie | Clerc | Anatomopathologiste | L@kshwini29 |
| dr.chevallier@hospital.fr | Simone | Chevallier | Médecin Traitant | L@kshwini29 |

## Tests à effectuer

### Test 1 : Connexion avec un compte réel

1. Ouvrez votre navigateur à `http://localhost:5173/`
2. Vous devriez voir la page de connexion OncoCollab
3. Saisissez les identifiants :
   - **Email** : `dr.germain@hospital.fr`
   - **Mot de passe** : `L@kshwini29`
4. Cliquez sur "Se connecter"

**Résultat attendu** :
- ✅ Message de succès : "Bienvenue, Adrien Germain!"
- ✅ Vous êtes redirigé vers le tableau de bord
- ✅ Le nom du docteur s'affiche dans le header

**En cas d'erreur** :
- ❌ Si vous voyez "Identifiants incorrects", vérifiez :
  - Que le backend est bien démarré
  - Que la base de données est accessible
  - Que le mot de passe est correct (avec majuscule et caractères spéciaux)
  - Que l'email est exact (pas d'espace)

### Test 2 : Persistance de la session

1. Après une connexion réussie, **rechargez la page** (F5 ou Cmd+R)

**Résultat attendu** :
- ✅ Vous restez connecté (pas de retour à la page de login)
- ✅ Message : "Session restaurée - Bienvenue, ..."
- ✅ Toutes vos données sont préservées

### Test 3 : Déconnexion

1. Cliquez sur le bouton de déconnexion dans le header
2. Vous devriez revenir à la page de connexion

**Résultat attendu** :
- ✅ Message : "Vous avez été déconnecté"
- ✅ Retour à la page de login
- ✅ Si vous rechargez, vous restez sur la page de login

### Test 4 : Session expirée (timeout)

1. Connectez-vous avec un compte
2. Attendez 30 minutes sans interagir avec la page (ou modifiez temporairement le timeout dans le code)

**Résultat attendu** :
- ✅ À 29 minutes : Warning "Votre session expirera dans 1 minute"
- ✅ À 30 minutes : Déconnexion automatique avec message "Session expirée après 30 minutes d'inactivité"

### Test 5 : Activité utilisateur

1. Connectez-vous avec un compte
2. Bougez la souris ou tapez sur le clavier régulièrement
3. Vérifiez que vous ne recevez pas d'avertissement d'expiration

**Résultat attendu** :
- ✅ Le timer de session se réinitialise à chaque mouvement/clic/touche
- ✅ Pas de déconnexion tant que vous êtes actif

### Test 6 : Connexion multi-utilisateurs en temps réel

**Important** : Pour ce test, vous avez besoin de **2 navigateurs différents** (ou 2 fenêtres de navigation privée).

#### Navigateur 1 :
1. Ouvrez `http://localhost:5173/` dans Chrome
2. Connectez-vous avec :
   - Email : `dr.germain@hospital.fr`
   - Mot de passe : `L@kshwini29`
3. Allez dans "Réunions RCP"
4. Rejoignez une réunion (cliquez sur "Rejoindre la visio")

#### Navigateur 2 :
1. Ouvrez `http://localhost:5173/` dans Firefox (ou fenêtre privée Chrome)
2. Connectez-vous avec :
   - Email : `dr.michel@hospital.fr`
   - Mot de passe : `L@kshwini29`
3. Allez dans "Réunions RCP"
4. Rejoignez la **même réunion**

**Résultats attendus** :
- ✅ Chaque utilisateur voit sa propre vidéo
- ✅ Chaque utilisateur voit la vidéo de l'autre participant
- ✅ Le nombre de participants affiche "2"
- ✅ Les utilisateurs peuvent activer/désactiver leur micro et caméra
- ✅ Les changements sont visibles en temps réel

### Test 7 : Chat en temps réel

Avec les 2 navigateurs du Test 6 :

1. Dans le navigateur 1, envoyez un message dans le chat
2. Vérifiez que le message apparaît dans le navigateur 2

**Résultat attendu** :
- ✅ Le message apparaît instantanément dans les deux fenêtres
- ✅ L'expéditeur est correctement affiché
- ✅ L'horodatage est correct

### Test 8 : WebRTC (Audio/Vidéo)

Avec les 2 navigateurs du Test 6 :

1. Autorisez l'accès au micro et à la caméra dans les deux navigateurs
2. Parlez dans le micro du navigateur 1
3. Écoutez dans le navigateur 2

**Résultat attendu** :
- ✅ Le son se transmet d'un navigateur à l'autre
- ✅ La vidéo se transmet en temps réel
- ✅ La qualité est acceptable (pas de freeze majeur)

### Test 9 : Déconnexion d'un participant

Avec les 2 navigateurs :

1. Dans le navigateur 1, quittez la réunion ou fermez l'onglet
2. Observez le navigateur 2

**Résultat attendu** :
- ✅ Le nombre de participants passe de 2 à 1
- ✅ La vidéo du participant déconnecté disparaît
- ✅ Un message indique qu'un utilisateur est parti

## Vérification des logs backend

Dans le terminal du backend, vous devriez voir :

```
[CONNEXION] Utilisateur authentifié: <socket-id> (dr.germain@hospital.fr)
[ROOM] <socket-id> (dr.germain@hospital.fr) rejoint la room rcp-...
[SIGNALING] Offer reçue de <socket-id> (dr.germain@hospital.fr) à destination de <autre-socket-id>
...
```

## Vérification de la sécurité JWT

### Test de sécurité : Connexion sans token

1. Ouvrez la console du navigateur (F12)
2. Essayez de vous connecter au WebSocket sans token :
   ```javascript
   const socket = io('https://localhost:3001');
   ```
3. Vérifiez les logs backend

**Résultat attendu** :
- ✅ Backend log : "[CONNEXION REFUSÉE] Pas de token JWT fourni"
- ✅ La connexion est rejetée
- ✅ Le socket est déconnecté immédiatement

### Test de sécurité : Token invalide

Dans la console :
```javascript
const socket = io('https://localhost:3001', {
  auth: { token: 'fake-token-123' }
});
```

**Résultat attendu** :
- ✅ Backend log : "[CONNEXION REFUSÉE] Token JWT invalide"
- ✅ La connexion est rejetée

## Dépannage

### Le backend ne démarre pas
```bash
cd rest-api
rm -rf dist node_modules
npm install
npm run start:dev
```

### La base de données n'est pas accessible
Vérifiez le fichier `.env` :
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=laksh
POSTGRES_PASSWORD=laksh
POSTGRES_DB=OncoCollab
```

### Erreur CORS
Si vous voyez des erreurs CORS dans la console du navigateur :
- Vérifiez que le backend est sur le port 3001
- Vérifiez que le frontend utilise bien `https://localhost:3001`

### Certificats SSL auto-signés
Si vous avez des avertissements de certificat :
1. Allez sur `https://localhost:3001` dans votre navigateur
2. Acceptez le certificat auto-signé
3. Retournez sur le frontend

### La vidéo ne fonctionne pas
1. Vérifiez que vous avez autorisé l'accès à la caméra/micro
2. Vérifiez que votre caméra n'est pas utilisée par une autre application
3. Essayez dans un autre navigateur

## Résumé des fonctionnalités testées

- ✅ Authentification avec JWT depuis la base de données PostgreSQL
- ✅ Persistance de session avec localStorage
- ✅ Timeout de session automatique (30 min)
- ✅ Restauration de session au rechargement de page
- ✅ Authentification WebSocket sécurisée avec JWT
- ✅ Connexion multi-utilisateurs en temps réel
- ✅ Chat en temps réel
- ✅ Audio/Vidéo WebRTC
- ✅ Gestion des participants (join/leave)
- ✅ Sécurité : Rejet des connexions non authentifiées

## Prochaines étapes

Une fois tous les tests validés, vous pouvez :
1. Changer les mots de passe par défaut dans la base de données
2. Configurer un vrai serveur TURN pour améliorer la connectivité WebRTC
3. Ajouter plus de validation et de gestion d'erreurs
4. Implémenter un système de rafraîchissement de token (refresh token)
