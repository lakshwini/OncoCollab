# OncoLlab - Plateforme RCP Numérique

**OncoLlab** est une plateforme complète de Réunion de Concertation Pluridisciplinaire (RCP) médicale pour la prise en charge collaborative des patients en oncologie.

## 🎯 Fonctionnalités Principales

### 1. Authentification & Sécurité (User Stories 1.1 & 1.2)
- ✅ Connexion sécurisée avec email professionnel + mot de passe
- ✅ Réinitialisation de mot de passe sécurisée
- ✅ Déconnexion automatique après 30 minutes d'inactivité
- ✅ Chiffrement SSL/TLS
- ✅ Gestion des rôles (Radiologue, Oncologue, Chirurgien, Pathologiste, Admin)
- ✅ Historique des connexions disponible
- ✅ Authentification OAuth2 / OpenID Connect (architecture)

### 2. Collaboration & Communication (User Stories 2.1, 2.2, 2.3)
- ✅ **Visioconférence intégrée** avec:
  - Partage d'écran et documents médicaux
  - Chat latéral archivé par dossier
  - Indicateur de statut (en cours / en attente / terminée)
  - Vue simultanée de l'imagerie médicale
  - Outils d'annotation (crayon, texte, formes)
  - Liste des participants avec statuts micro/caméra
- ✅ **Documents collaboratifs**:
  - Zone "Documents personnels" par utilisateur
  - Dossier "Documents généraux" modifiable par tous
  - Gestion des versions et commentaires
  - Annotations texte, dessin et sur image

### 3. Planification & Notifications (User Stories 3.1 & 3.2)
- ✅ **Calendrier partagé** avec:
  - Synchronisation Google Calendar et Outlook
  - Indication de disponibilité des participants
  - Planification assistée par IA
  - Suggestions automatiques de créneaux optimaux
- ✅ **Notifications automatiques**:
  - Rappels 24h et 1h avant les réunions
  - Notifications "Nouveau dossier ajouté"
  - Pop-up "Dossier en attente de validation"
  - Email de confirmation d'inscription

### 4. Gestion de Dossiers Patients & Imagerie (User Stories 4.1, 4.2, 4.3)
- ✅ **Gestion complète des dossiers**:
  - Création, modification, suppression sécurisée
  - Statuts: "En attente", "En cours", "Validé"
  - Historique des modifications avec traçabilité
- ✅ **Imagerie médicale DICOM**:
  - Ajout et visualisation d'images médicales
  - Zoom et navigation sur les images
  - Annotations collaboratives
  - Suppression / mise à jour avec gestion de versions
- ✅ **Documents par spécialité**:
  - Espace personnel dédié par rôle
  - Partage sélectif avec ou sans droit d'édition
  - Accès rapide depuis le tableau de bord

### 5. Intelligence Artificielle (User Story 5.1)
- ✅ **Planification automatisée**:
  - Analyse des disponibilités de tous les participants
  - Proposition automatique de dates optimales
  - Notifications intelligentes
- ✅ **Création automatique de canaux**:
  - Canaux dédiés par patient selon le type de cancer
  - Ajout automatique des spécialistes concernés
  - Inclusion du dossier complet avec imageries
- ✅ **Suggestions sur imagerie**:
  - Annotations et segmentations automatiques
  - Zones d'intérêt détectées par IA
  - Validation/modification par les spécialistes
  - Historique complet des validations
- ✅ **Recommandations de participants**:
  - Suggestion d'invités pertinents selon le type de cas
  - Propositions d'actions supplémentaires
- ✅ **Génération automatique de rapports**:
  - Synthèse de toutes les décisions et annotations
  - Envoi pour validation finale
  - Rappels et suivi post-RCP

### 6. Accessibilité & Résilience (User Stories 6.1, 6.2, 6.3)
- ✅ **Interface ergonomique**:
  - Design médical épuré avec dominante bleue foncée
  - Navigation fluide et intuitive
  - Tableau de bord avec filtres avancés
  - Barre de recherche globale
  - Interface responsive (desktop & mobile)
- ✅ **Guide d'utilisation intégré**:
  - Guides pas à pas interactifs
  - Tutoriels vidéo
  - FAQ détaillée
  - Aide contextuelle
- ✅ **Sauvegardes & Résilience**:
  - Sauvegarde quotidienne automatique
  - Journal d'activité complet
  - Indicateurs de statut système

## 🚀 Démarrage Rapide

### Comptes de démonstration

L'application fonctionne en mode démo avec les comptes suivants:

- **Radiologue**: `radiologue@hopital.fr` / n'importe quel mot de passe
- **Oncologue**: `oncologue@hopital.fr` / n'importe quel mot de passe  
- **Chirurgien**: `chirurgien@hopital.fr` / n'importe quel mot de passe

### Navigation

1. **Tableau de bord** - Vue d'ensemble de l'activité
2. **Patients** - Gestion des dossiers patients
3. **Calendrier RCP** - Planification avec assistance IA
4. **Mes Documents** - Espace de travail collaboratif
5. **Réunions** - Liste et accès aux RCP
6. **Messagerie** - Communication entre praticiens
7. **AgentIA** - Assistant intelligent
8. **Aide** - Guide complet et tutoriels
9. **Paramètres** - Configuration du profil

## 🔒 Sécurité

- **Connexion SSL/TLS** pour toutes les communications
- **Expiration automatique** de session après 30 min d'inactivité
- **Chiffrement** des données sensibles
- **Traçabilité complète** de toutes les actions
- **Gestion fine des permissions** par rôle utilisateur

## 🎨 Design System

### Couleurs principales
- **Fond principal**: `#0f1419` (Bleu très foncé)
- **Fond secondaire**: `#1a1f2e` (Bleu foncé)
- **Accent primaire**: `#3b82f6` (Bleu)
- **Texte**: `#ffffff` (Blanc) / `#9ca3af` (Gris)

### Typographie
- Police système optimisée pour la lisibilité médicale
- Hiérarchie claire des titres et contenus
- Tailles adaptatives pour tous les écrans

## 📦 Architecture Technique

### Frontend
- **React** avec TypeScript
- **Tailwind CSS** v4.0 pour le styling
- **Shadcn/ui** pour les composants
- **Lucide React** pour les icônes

### Composants clés
- `LoginPage` - Authentification sécurisée
- `DashboardAdvanced` - Tableau de bord
- `VideoConferenceAdvanced` - Visioconférence avec imagerie
- `CalendarAdvanced` - Calendrier avec IA
- `WorkspaceDocuments` - Gestion documentaire
- `HelpGuide` - Centre d'aide
- `AgentIA` - Assistant intelligent

### Gestion d'état
- React Hooks (useState, useEffect)
- Session management avec auto-logout
- Notifications avec Sonner

## 🔮 Intégration Future - Supabase

Pour une utilisation en production, l'application nécessitera:

- **Base de données** pour les dossiers patients
- **Authentification** OAuth2/OpenID Connect
- **Stockage** pour les imageries DICOM
- **Temps réel** pour la collaboration
- **API sécurisées** pour les données médicales

⚠️ **Important**: OncoLlab n'est pas conçu pour collecter des données personnelles identifiables (PII) ou sécuriser des données sensibles sans infrastructure backend appropriée.

## 📱 Responsive Design

L'application s'adapte à tous les écrans:
- **Desktop** (1920x1080+) - Expérience complète
- **Laptop** (1366x768+) - Interface optimisée
- **Tablet** (768px+) - Navigation adaptée
- **Mobile** (375px+) - Vue simplifiée

## 🎯 Cas d'usage

1. **Planification de RCP** - L'IA suggère les meilleurs créneaux
2. **Réunion collaborative** - Visio + imagerie + chat + annotations
3. **Validation de rapports** - Workflow documentaire complet
4. **Suivi patient** - Historique et traçabilité
5. **Formation** - Guides et tutoriels intégrés

## 🌐 Conformité & Standards

- Interface conforme aux standards médicaux
- Respect de la confidentialité des données
- Traçabilité complète des actions
- Architecture prête pour certification HDS (Hébergement de Données de Santé)

## 📄 License

Ce projet est un prototype de démonstration. Pour une utilisation en production dans un environnement médical réel, veuillez consulter les réglementations locales et obtenir les certifications nécessaires.

---

**OncoLlab** - Collaboration médicale intelligente pour de meilleurs soins oncologiques 🏥
