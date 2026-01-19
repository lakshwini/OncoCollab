# 📁 Structure du Projet OncoLlab

## 🌳 Arborescence

```
oncollab/
├── 📄 App.tsx                          # Point d'entrée principal
├── 📄 README.md                        # Documentation principale
├── 📄 FONCTIONNALITES.md              # Liste détaillée des fonctionnalités
├── 📄 GUIDE_DEMARRAGE.md              # Guide utilisateur
├── 📄 STRUCTURE_PROJET.md             # Ce fichier
├── 📄 Attributions.md                 # Crédits et attributions
│
├── 📁 components/                      # Composants React
│   │
│   ├── 🔐 LoginPage.tsx               # Authentification
│   ├── 📊 DashboardAdvanced.tsx       # Tableau de bord principal
│   ├── 📊 Dashboard.tsx               # Dashboard original (legacy)
│   │
│   ├── 👥 PatientDossiers.tsx         # Liste des dossiers patients
│   ├── 📄 DossierDetail.tsx           # Détail d'un dossier
│   │
│   ├── 🎥 VideoConferenceAdvanced.tsx # Visioconférence avec imagerie
│   ├── 🎥 VideoConference.tsx         # Visio original (legacy)
│   │
│   ├── 📅 CalendarAdvanced.tsx        # Calendrier avec IA
│   ├── 📅 Calendar.tsx                # Calendrier original (legacy)
│   │
│   ├── 📄 WorkspaceDocuments.tsx      # Espace de travail documentaire
│   ├── 💬 Messaging.tsx               # Messagerie inter-équipe
│   ├── 🎯 RCPMeetings.tsx             # Gestion des réunions RCP
│   │
│   ├── 🤖 AgentIA.tsx                 # Assistant intelligent
│   │
│   ├── ❓ HelpGuide.tsx               # Centre d'aide
│   ├── ⚙️ Settings.tsx                # Paramètres utilisateur
│   │
│   ├── 🧩 Header.tsx                  # En-tête avec menu utilisateur
│   ├── 🧩 Sidebar.tsx                 # Barre de navigation latérale
│   ├── 🧩 NotificationsPanel.tsx      # Panel de notifications
│   ├── 🧩 ImageAnnotator.tsx          # Outils d'annotation
│   │
│   ├── 📁 figma/                      # Composants Figma
│   │   └── ImageWithFallback.tsx      # Gestion des images
│   │
│   └── 📁 ui/                         # Composants UI Shadcn
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── sonner.tsx
│       └── ... (autres composants UI)
│
└── 📁 styles/                         # Styles globaux
    └── globals.css                     # Thème et variables CSS
```

---

## 📦 Composants Principaux

### 🔐 Authentification & Sécurité

#### `LoginPage.tsx`
**Rôle** : Page de connexion sécurisée

**Fonctionnalités** :
- Formulaire email + mot de passe
- Dialog de réinitialisation de mot de passe
- Indicateurs SSL/TLS et OAuth2
- Comptes de démonstration
- Validation des champs

**User Stories** : 1.1, 1.2

---

### 📊 Tableaux de Bord

#### `DashboardAdvanced.tsx`
**Rôle** : Vue d'ensemble de l'activité RCP

**Sections** :
- **Statistiques clés** : Dossiers, RCP, Validation, Équipe
- **Suggestions AgentIA** : Recommandations intelligentes
- **Dossiers récents** : Derniers patients
- **Prochaines RCP** : Calendrier
- **Activité du mois** : Barres de progression
- **État du système** : Monitoring

**Props** :
```typescript
interface DashboardAdvancedProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}
```

**User Stories** : Toutes (vue unifiée)

---

### 👥 Gestion des Patients

#### `PatientDossiers.tsx`
**Rôle** : Liste et recherche de dossiers patients

**Fonctionnalités** :
- Liste des dossiers avec filtres
- Recherche par nom/type/statut
- Badges de statut colorés
- Création de nouveau dossier

#### `DossierDetail.tsx`
**Rôle** : Vue détaillée d'un dossier patient

**Sections** :
- Informations patient
- Documents médicaux
- Imageries DICOM
- Historique des modifications

**User Stories** : 4.1, 4.2, 4.3

---

### 🎥 Visioconférence

#### `VideoConferenceAdvanced.tsx`
**Rôle** : Réunion RCP complète avec imagerie

**Layout** :
```
┌─────────────┬──────────────────────┬─────────────┐
│   Sidebar   │                      │   Sidebar   │
│   Gauche    │     Zone Vidéo       │   Droite    │
│  (Patient)  │    + Imagerie        │ (Chat/Docs) │
│             │                      │             │
│  - Infos    │  ┌──────────────┐   │  - Chat     │
│  - Docs     │  │   Imagerie   │   │  - Membres  │
│  - Examens  │  │   Médicale   │   │  - Docs     │
│  - Histo    │  └──────────────┘   │  - Partage  │
│             │  [Participants]      │             │
└─────────────┴──────────────────────┴─────────────┘
        [Contrôles : Mic | Cam | Partage | Chat | Fin]
```

**Fonctionnalités** :
- Affichage multi-participants
- Imagerie médicale centrale
- Toolbar d'annotation (curseur, crayon, texte, formes)
- Zoom et navigation
- Suggestions IA en overlay
- Chat temps réel
- Partage de documents
- Contrôles audio/vidéo

**User Stories** : 2.1, 2.2, 2.3, 4.2, 5.1

---

### 📅 Calendrier & Planification

#### `CalendarAdvanced.tsx`
**Rôle** : Planification intelligente des RCP

**Layout** :
```
┌─────────────────────────┬─────────────────┐
│    Calendrier Mensuel   │   Planification │
│                         │   Assistée IA   │
│  [Navigation Mois]      │                 │
│  [Vues: Mois|Sem|Jour]  │  - Suggestions  │
│                         │  - Participants │
│  ┌───┬───┬───┬───┐     │  - Invitations  │
│  │ 1 │ 2 │ 3 │...│     │                 │
│  ├───┼───┼───┼───┤     │                 │
│  │...│...│RCP│...│     │                 │
│  └───┴───┴───┴───┘     │                 │
└─────────────────────────┴─────────────────┘
```

**Fonctionnalités** :
- Grille calendrier mensuelle
- Événements RCP colorés
- Suggestions IA de créneaux optimaux
- Liste participants avec statuts
- Boutons sync Google/Outlook
- Vues multiples (Mois/Semaine/Jour)

**User Stories** : 3.1, 3.2, 5.1

---

### 📄 Espace de Travail

#### `WorkspaceDocuments.tsx`
**Rôle** : Gestion collaborative des documents

**Sections** :
- **En-tête** : Statistiques (Mes docs, Partagés, À valider)
- **Tableau principal** : Liste documents avec filtres
- **Sidebar** : Rapports à valider, Partagés avec moi, Stockage

**Tableau des documents** :
```
┌──────────────────┬─────────┬──────────┬────────┬─────────┐
│ Nom du document  │ Patient │   Date   │ Statut │ Actions │
├──────────────────┼─────────┼──────────┼────────┼─────────┤
│ Rapport RCP - JD │ J.D.    │15/07/24  │ 🟡 ... │[Valider]│
│ Analyse - MC     │ M.C.    │14/07/24  │ 🟢 ... │[Détails]│
└──────────────────┴─────────┴──────────┴────────┴─────────┘
```

**Fonctionnalités** :
- Recherche globale
- Filtres (Type, Statut, Patient)
- Validation rapide de rapports
- Gestion des partages
- Indicateur de stockage

**User Stories** : 2.3, 4.3, 5.2

---

### 🤖 Intelligence Artificielle

#### `AgentIA.tsx`
**Rôle** : Assistant intelligent pour les RCP

**Fonctionnalités** :
- **Planification automatique** : Suggestions de créneaux
- **Analyse d'imagerie** : Détection zones suspectes
- **Recommandations** : Ajout participants pertinents
- **Génération rapports** : Synthèse automatique
- **Historique** : Rapports générés

**Interface** :
```
┌─────────────────────────────────────────┐
│  🤖 AgentIA - Assistant Intelligent     │
├─────────────────────────────────────────┤
│                                         │
│  💡 Suggestions actives:                │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 📅 Planifier RCP pour 3 doss. │    │
│  │ Meilleur: Mer 16 Oct à 10:00  │    │
│  │             [Planifier]        │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 🔬 2 imageries prêtes          │    │
│  │ Analyse IA disponible          │    │
│  │             [Analyser]         │    │
│  └────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**User Stories** : 5.1, 5.2

---

### ❓ Centre d'Aide

#### `HelpGuide.tsx`
**Rôle** : Documentation et support utilisateur

**Onglets** :

1. **📚 Guides rapides**
   - Guides pas à pas avec étapes numérotées
   - Durée estimée
   - Boutons d'action

2. **🎬 Tutoriels vidéo**
   - Vidéos de démonstration
   - Durée et description
   - Boutons de lecture

3. **❓ FAQ**
   - Questions fréquentes
   - Accordion interactif
   - Réponses détaillées

**User Stories** : 6.2

---

### 🧩 Composants Partagés

#### `Header.tsx`
**Rôle** : En-tête de l'application

**Éléments** :
- Date du jour avec horloge
- Bouton notifications (badge rouge si nouvelles)
- Menu utilisateur (Avatar, Nom, Rôle)
- Dropdown : Profil, Historique, Déconnexion

#### `Sidebar.tsx`
**Rôle** : Navigation principale

**Structure** :
```
┌─────────────────────┐
│  🔷 OncoLlab        │  ← Logo + Nom
│  Plateforme RCP     │
├─────────────────────┤
│                     │
│  🏠 Tableau de bord │  ← Navigation
│  👥 Patients        │
│  📅 Calendrier RCP  │
│  📄 Mes Documents🟡 │  ← Badge
│  🎥 Réunions        │
│  💬 Messagerie      │
│  🤖 AgentIA 🔵      │  ← Highlight
│                     │
│  ─────────────────  │
│  SUPPORT            │
│  ❓ Aide            │
│  ⚙️ Paramètres      │
│                     │
│  ─────────────────  │
│  🟢 Connexion       │  ← Sécurité
│     sécurisée       │
│     SSL/TLS actif   │
└─────────────────────┘
```

#### `NotificationsPanel.tsx`
**Rôle** : Panel de notifications déroulant

**Types de notifications** :
- Rappels RCP (24h, 1h avant)
- Nouveau dossier ajouté
- Rapport à valider
- Session expire bientôt

---

## 🎨 Système de Design

### Couleurs

```css
/* Fonds */
--bg-primary: #0f1419;      /* Bleu très foncé */
--bg-secondary: #1a1f2e;    /* Bleu foncé */
--bg-tertiary: #252b3b;     /* Bleu moyen */

/* Textes */
--text-primary: #ffffff;    /* Blanc */
--text-secondary: #9ca3af;  /* Gris clair */
--text-tertiary: #6b7280;   /* Gris moyen */

/* Accents */
--accent-blue: #3b82f6;     /* Bleu primaire */
--accent-green: #22c55e;    /* Vert succès */
--accent-yellow: #eab308;   /* Jaune attention */
--accent-red: #ef4444;      /* Rouge erreur */
--accent-purple: #a855f7;   /* Violet IA */
```

### Badges de Statut

| Statut | Couleur | Usage |
|--------|---------|-------|
| 🟢 Validé | Vert | Dossiers finalisés, Système OK |
| 🔵 En cours | Bleu | Dossiers actifs, Traitement |
| 🟡 En attente | Jaune | Nouveau, À valider, Attention |
| 🔴 Annulé / Erreur | Rouge | Refus, Problème |
| 🟣 IA | Violet | Suggestions, Intelligence |

### Composants Shadcn/ui

Tous les composants utilisent le système de design Shadcn :
- Variants cohérentes (default, outline, ghost, destructive)
- Sizes standardisées (sm, md, lg, icon)
- Thème sombre optimisé
- Accessibilité (aria-labels, keyboard navigation)

---

## 🔄 Flux de Données

### État Global (App.tsx)

```typescript
// États principaux
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [currentPage, setCurrentPage] = useState<Page>('dashboard');
const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

// Gestion de session
const [lastActivityTime, setLastActivityTime] = useState(Date.now());
const [showInactivityWarning, setShowInactivityWarning] = useState(false);
```

### Navigation

```typescript
type Page = 
  | 'dashboard' 
  | 'dossiers' 
  | 'dossier-detail' 
  | 'reunions' 
  | 'video' 
  | 'workspace' 
  | 'messagerie' 
  | 'agentia' 
  | 'calendrier' 
  | 'aide' 
  | 'parametres';

const navigateTo = (page: Page, dossierId?: string) => {
  setCurrentPage(page);
  if (dossierId) setSelectedDossierId(dossierId);
};
```

### Utilisateur

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

type UserRole = 
  | 'radiologue' 
  | 'oncologue' 
  | 'chirurgien' 
  | 'pathologiste' 
  | 'admin';
```

---

## 🚀 Points d'Entrée

### `App.tsx`

**Responsabilités** :
1. Gestion authentification
2. Routing des pages
3. Session management (30 min auto-logout)
4. Toast notifications
5. Layout principal (Sidebar + Header + Main)

**Cycle de vie** :
```
Démarrage
    ↓
LoginPage (si non authentifié)
    ↓
Login réussi → setIsAuthenticated(true)
    ↓
Affichage de l'application
    ↓
[Sidebar] [Header] [Main Content]
    ↓
Navigation via Sidebar/Boutons
    ↓
Changement de currentPage → Re-render Main
    ↓
Auto-logout après 30 min inactivité
```

---

## 📚 Composants UI Shadcn Utilisés

### Essentiels
- **Button** : Toutes les actions
- **Card** : Containers de contenu
- **Badge** : Statuts et indicateurs
- **Avatar** : Photos utilisateurs

### Navigation
- **Tabs** : Onglets (Visio, Calendrier, Aide)
- **Dropdown Menu** : Menu utilisateur
- **Separator** : Séparateurs visuels

### Formulaires
- **Input** : Champs de saisie
- **Label** : Labels de formulaires
- **Select** : Listes déroulantes
- **Textarea** : Zones de texte

### Affichage de données
- **Table** : Tableaux de données
- **Progress** : Barres de progression
- **Scroll Area** : Zones scrollables

### Interactions
- **Dialog** : Modales
- **Alert** : Messages importants
- **Toast / Sonner** : Notifications
- **Accordion** : FAQ extensible

---

## 🔧 Configuration

### `styles/globals.css`

**Variables CSS** :
- Couleurs du thème
- Rayons de bordure
- Espacements
- Typographie

**Thème sombre par défaut** :
```css
:root {
  --background: #0f1419;
  --foreground: #ffffff;
  --primary: #3b82f6;
  /* ... */
}
```

---

## 📊 Métriques de Code

| Métrique | Valeur |
|----------|--------|
| **Composants principaux** | 13 |
| **Composants UI (Shadcn)** | 40+ |
| **Pages** | 11 |
| **User Stories implémentées** | 13/13 (100%) |
| **Lignes de code** | ~8000+ |
| **Fichiers TypeScript** | 50+ |

---

## 🔮 Architecture Future (avec Supabase)

### Backend Supabase

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  ┌─────────────────────────────────┐   │
│  │  Components                      │   │
│  └─────────────┬───────────────────┘   │
└────────────────┼───────────────────────┘
                 │
                 │ API Calls
                 ↓
┌─────────────────────────────────────────┐
│          Supabase Backend               │
│  ┌─────────────────────────────────┐   │
│  │  Auth (OAuth2/OpenID)           │   │
│  │  Database (PostgreSQL)          │   │
│  │  Storage (Images DICOM)         │   │
│  │  Realtime (Collaboration)       │   │
│  │  Edge Functions (API)           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Tables Database

```sql
-- Utilisateurs
users (id, email, role, name, avatar_url)

-- Patients
patients (id, name, birth_date, cancer_type, status)

-- Dossiers
dossiers (id, patient_id, created_by, status, created_at)

-- Documents
documents (id, dossier_id, name, type, url, owner_id, shared)

-- Imageries
imageries (id, dossier_id, type, dicom_url, annotations)

-- RCP
meetings (id, title, date, time, status, created_by)
meeting_participants (meeting_id, user_id, status)

-- Messages
messages (id, meeting_id, user_id, content, created_at)

-- Notifications
notifications (id, user_id, type, content, read, created_at)
```

---

## 📝 Conventions de Code

### Nommage

- **Composants** : PascalCase (`DashboardAdvanced.tsx`)
- **Props** : PascalCase + Props suffix (`DashboardAdvancedProps`)
- **Hooks** : camelCase (`useState`, `useEffect`)
- **Fonctions** : camelCase (`handleLogin`, `navigateTo`)
- **Constants** : UPPER_SNAKE_CASE (rare)

### Structure fichier

```typescript
// 1. Imports
import { useState } from 'react';
import { ComponenteUI } from './ui/component';

// 2. Types/Interfaces
interface MyComponentProps {
  prop: string;
}

// 3. Composant
export function MyComponent({ prop }: MyComponentProps) {
  // 3a. States
  const [state, setState] = useState();
  
  // 3b. Effects
  useEffect(() => {}, []);
  
  // 3c. Handlers
  const handleAction = () => {};
  
  // 3d. Render
  return <div>...</div>;
}
```

### Bonnes pratiques

✅ Composants fonctionnels uniquement  
✅ TypeScript strict  
✅ Props destructurées  
✅ Key unique pour les listes  
✅ Accessibilité (aria-labels)  
✅ Commentaires pour logique complexe  
✅ Tailwind classes cohérentes  

---

## 🎯 Prochaines Étapes de Développement

### Phase 1 : Optimisation
- [ ] Lazy loading des composants
- [ ] Memoization (React.memo, useMemo)
- [ ] Code splitting
- [ ] Performance monitoring

### Phase 2 : Tests
- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration (React Testing Library)
- [ ] Tests E2E (Cypress)
- [ ] Coverage > 80%

### Phase 3 : Intégration Supabase
- [ ] Configuration Supabase
- [ ] Authentication OAuth2
- [ ] Database migrations
- [ ] Storage setup
- [ ] Realtime subscriptions

### Phase 4 : Fonctionnalités Avancées
- [ ] Export PDF rapports
- [ ] Import/Export DICOM réel
- [ ] API calendriers (Google, Outlook)
- [ ] Notifications push
- [ ] Mode offline (PWA)

### Phase 5 : Production
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry)
- [ ] Analytics
- [ ] Documentation API
- [ ] Certification HDS

---

**OncoLlab** - Architecture modulaire et évolutive 🏗️
