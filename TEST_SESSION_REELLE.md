# 🧪 Test des Sessions Réelles - Multi-Docteurs

## 🎯 Ce qui a été fait

### 1. ✅ **Login Médical Professionnel**
- Design épuré avec icône stéthoscope
- Fond médical avec motif croix
- Suppression des textes "OAuth2", "SSL/TLS" (plus propre)
- Connexion RÉELLE à l'API backend
- Affichage des vrais comptes de la BDD

### 2. ✅ **Gestion des Sessions**
- Token JWT stocké dans localStorage
- Infos du docteur stockées dans localStorage
- Session persistante après connexion

### 3. ✅ **Affichage du Vrai Nom**
- Dans la visio, on voit maintenant votre **vrai nom**
- Au lieu de "Vous (Radiologue)" → "Vous (Dr. Maggie Michel)"
- Avatar avec vos initiales (MM, AG, etc.)

---

## 🚀 Comment Tester en 3 Minutes

### Étape 1 : Démarrer le Backend

```bash
cd rest-api
npm run start:dev
```

**✅ Vérifiez :**
```
✅ Certificats SSL chargés avec succès
✅ Serveur lancé sur https://localhost:3001
```

### Étape 2 : Démarrer le Frontend

```bash
# Nouveau terminal à la racine
npm run dev
```

### Étape 3 : Tester avec 2 Comptes Différents

#### Navigateur 1 (Chrome)

1. Ouvrir : `http://localhost:5173`
2. Se connecter avec : **dr.michel@hospital.fr** / `password123`
3. Aller dans "RCP Meetings"
4. Cliquer sur "Démarrer une RCP"
5. **Vérifier** : En haut, tu vois "Dr. Maggie Michel"
6. **Vérifier** : Sur ta vidéo, il y a "Vous (Dr. Maggie Michel)"

#### Navigateur 2 (Firefox ou Incognito)

1. Ouvrir : `http://localhost:5173`
2. Se connecter avec : **dr.germain@hospital.fr** / `password123`
3. Aller dans "RCP Meetings"
4. Rejoindre la **MÊME** RCP (même room)
5. **Vérifier** : Tu vois "Dr. Adrien Germain" en haut
6. **Vérifier** : Sur ta vidéo : "Vous (Dr. Adrien Germain)"

#### ✅ Résultat Attendu

Les **2 docteurs se voient** dans leurs grilles respectives :
- Dr. Michel voit : Sa vidéo + la vidéo de Dr. Germain
- Dr. Germain voit : Sa vidéo + la vidéo de Dr. Michel

---

## 📋 Comptes Disponibles

| Email | Nom Complet | Rôle | Mot de passe |
|-------|-------------|------|--------------|
| dr.germain@hospital.fr | Dr. Adrien Germain | Radiologue | password123 |
| dr.michel@hospital.fr | Dr. Maggie Michel | Oncologue | password123 |
| dr.rivière@hospital.fr | Dr. Virginie Rivière | Chirurgien | password123 |
| dr.clerc@hospital.fr | Dr. Virginie Clerc | Pathologiste | password123 |
| dr.chevallier@hospital.fr | Dr. Simone Chevallier | Admin | password123 |

---

## 🎨 Nouveau Design Login

### ❌ AVANT
```
- Fond bleu foncé sombre
- Icône Shield (sécurité)
- Textes : "OAuth2", "SSL/TLS", "Déconnexion auto 30 min"
- Look "corporate sécurité"
```

### ✅ APRÈS (Médical)
```
- Fond blanc dégradé bleu clair
- Icône Stéthoscope (médical)
- Motif croix médicales en background
- Bouton dégradé bleu → cyan
- Champs arrondis (rounded-xl)
- Liste des comptes avec cartes
- Look "professionnel médical"
```

---

## 🔍 Ce qui se passe en Coulisses

### À la connexion :

1. **POST /auth/login**
   ```json
   {
     "email": "dr.michel@hospital.fr",
     "password": "password123"
   }
   ```

2. **Réponse du serveur**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "doctor": {
       "doctorid": "19f210fa-7fab-47a8-badd-fdb7cf1a5c0d",
       "email": "dr.michel@hospital.fr",
       "firstname": "Maggie",
       "lastname": "Michel",
       "roleid": 2
     }
   }
   ```

3. **Stockage localStorage**
   ```javascript
   localStorage.setItem('authToken', token);
   localStorage.setItem('doctorInfo', JSON.stringify(doctor));
   ```

### Dans la visio :

4. **Récupération des infos**
   ```javascript
   const doctorInfo = JSON.parse(localStorage.getItem('doctorInfo'));
   const currentDoctorName = `Dr. ${doctorInfo.firstname} ${doctorInfo.lastname}`;
   // Résultat : "Dr. Maggie Michel"
   ```

5. **Affichage**
   - Header : "Dr. Maggie Michel • 1 participant • Room: rcp-reunion"
   - Vidéo locale : "Vous (Dr. Maggie Michel)"
   - Avatar : "MM" (initiales)

---

## 🐛 Problèmes Courants

### Problème 1 : "Email ou mot de passe incorrect"

**Cause :** Le backend n'est pas démarré ou l'API ne répond pas.

**Solution :**
```bash
# Vérifier que le backend tourne
cd rest-api
npm run start:dev

# Vérifier l'URL dans la console
# Devrait voir : POST https://localhost:3001/auth/login
```

### Problème 2 : Toujours "Docteur" au lieu du vrai nom

**Cause :** Le localStorage n'a pas les bonnes infos.

**Solution :**
```javascript
// Ouvrir la console du navigateur (F12)
localStorage.getItem('doctorInfo')

// Devrait afficher :
// {"doctorid":"...","email":"dr.michel@hospital.fr","firstname":"Maggie","lastname":"Michel","roleid":2}

// Si null ou vide, se reconnecter
```

### Problème 3 : Les deux docteurs ne se voient pas

**Cause :** Ils ne sont pas dans la même room.

**Solution :**
- Vérifier que les deux ont le même "Room ID" affiché en bas
- Par défaut : "rcp-mme-dupont"
- Si différent, utiliser la props `roomId` pour forcer la même room

---

## ✅ Checklist de Test

- [ ] Backend démarré avec succès (https://localhost:3001)
- [ ] Frontend démarré (http://localhost:5173)
- [ ] Login avec dr.michel@hospital.fr fonctionne
- [ ] On voit "Dr. Maggie Michel" en haut après connexion
- [ ] Dans la visio, on voit "Vous (Dr. Maggie Michel)"
- [ ] Avatar affiche "MM"
- [ ] Deuxième navigateur : login avec dr.germain@hospital.fr
- [ ] Deuxième navigateur voit "Dr. Adrien Germain"
- [ ] Les deux navigateurs rejoignent la même RCP
- [ ] Les deux docteurs se voient mutuellement
- [ ] Les noms sont corrects sur chaque vidéo

---

## 🎉 Résultat Final

Quand **Dr. Maggie Michel** et **Dr. Adrien Germain** sont dans la même visio :

```
┌─────────────────────────────────────┐
│ Dr. Maggie Michel (Navigateur 1)   │
├─────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐    │
│  │ Vous (Dr.  │  │ Dr. Adrien │    │
│  │ Maggie     │  │ Germain    │    │
│  │ Michel)    │  │            │    │
│  │ [MM]       │  │ [AG]       │    │
│  └────────────┘  └────────────┘    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Dr. Adrien Germain (Navigateur 2)  │
├─────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐    │
│  │ Vous (Dr.  │  │ Dr. Maggie │    │
│  │ Adrien     │  │ Michel     │    │
│  │ Germain)   │  │            │    │
│  │ [AG]       │  │ [MM]       │    │
│  └────────────┘  └────────────┘    │
└─────────────────────────────────────┘
```

---

## 📝 Notes Techniques

### Mapping des Rôles

```typescript
const roleMap: Record<number, UserRole> = {
  1: 'radiologue',
  2: 'oncologue',
  3: 'chirurgien',
  4: 'pathologiste',
  5: 'admin'
};
```

### Structure localStorage

```javascript
// authToken
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ..."

// doctorInfo
{
  "doctorid": "19f210fa-7fab-47a8-badd-fdb7cf1a5c0d",
  "email": "dr.michel@hospital.fr",
  "firstname": "Maggie",
  "lastname": "Michel",
  "roleid": 2
}
```

---

**Durée du test complet** : 3-5 minutes
**Dernière mise à jour** : 2026-01-30

✨ **Profitez de vos sessions réelles avec les vrais noms !**
