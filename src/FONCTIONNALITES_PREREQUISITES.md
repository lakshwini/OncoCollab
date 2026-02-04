# Fonctionnalités de Pré-requis et Gestion des Participants

## Vue d'ensemble

OncoCollab intègre désormais un système complet de gestion des pré-requis pour garantir que chaque spécialiste arrive préparé aux réunions RCP. Ce système améliore l'efficacité des visioconférences et la coordination entre spécialistes.

---

## 1. Pré-requis pour chaque spécialiste

### Description
Avant chaque réunion, une section "Pré-requis" est associée à chaque participant. Cette section liste l'ensemble des tâches que le spécialiste doit avoir réalisées avant la réunion.

### Exemples de pré-requis
- Consultation du dossier patient
- Analyse des examens récents (IRM, scanner, analyses biologiques…)
- Mise à jour des comptes rendus
- Préparation des recommandations ou hypothèses médicales

### Fonctionnement
- **États des tâches** :
  - ⏳ **À faire** (`pending`) : Tâche non complétée
  - ✅ **Terminée** (`completed`) : Tâche réalisée

- **Indicateurs visuels** :
  - Badge sur l'avatar du participant (vert = prêt, ambre = en préparation)
  - Barre de progression indiquant le pourcentage de complétion
  - Compteur de pré-requis complétés (ex: 2/4)

### Bénéfices
- Réunions plus efficaces
- Moins de temps perdu à rappeler le contexte
- Meilleure coordination entre spécialistes

---

## 2. Visualisation des participants en visioconférence

### Description
Pendant la visioconférence, une fonctionnalité permet de visualiser clairement tous les participants connectés avec leurs informations détaillées.

### Éléments affichés
- **Photo ou avatar** avec initiales
- **Nom et prénom complet**
- **Rôle / spécialité** (ex : Oncologue, Radiologue, Chirurgien…)
- **Indicateur de préparation** (badge vert ou ambre)
- **État audio/vidéo** (micro et caméra activés/désactivés)
- **Progression des pré-requis** (barre de progression et pourcentage)

### Localisation
- Onglet "Participants" dans la barre latérale droite de la visioconférence
- Compteur total affiché en haut de l'onglet
- Liste scrollable pour gérer de nombreux participants

---

## 3. Filtrage des participants par rôle

### Description
Un menu déroulant "Rôles" permet de filtrer les participants lorsqu'il y a beaucoup de personnes connectées.

### Fonctionnement
1. Cliquer sur le bouton "Filtrer" avec l'icône de filtre
2. Sélectionner un rôle dans le menu déroulant
3. La liste affiche uniquement les participants de ce rôle
4. Compteur indiquant le nombre de personnes par rôle

### Exemple d'utilisation
```
Filtrer par rôle ▾
├─ Tous les participants (6)
├─ Oncologue (2)
│  ├─ Dr. Bernard
│  └─ Dr. Benali
├─ Radiologue (2)
│  ├─ Dr. Martin
│  └─ Dr. Rossi
├─ Chirurgien (1)
│  └─ Dr. Lefevre
└─ Pathologiste (1)
   └─ Dr. Moreau
```

### Fonctionnalités
- Badge affichant le filtre actif
- Bouton "Effacer le filtre" pour revenir à la vue complète
- Mise à jour dynamique du compteur de participants

---

## 4. Accès aux pré-requis pendant la réunion

### Description
En cliquant sur un participant dans l'onglet "Participants", une fiche récapitulative détaillée s'ouvre en modal.

### Contenu de la fiche
- **En-tête** :
  - Avatar avec initiales
  - Nom complet du participant
  - Badge de rôle/spécialité
  - Email professionnel
  
- **État de préparation** :
  - Badge "Prêt" (vert) ou "En préparation" (ambre)
  - Barre de progression globale
  - Pourcentage de complétion
  - Compteur de tâches (ex: 3/4 tâches)

- **Liste détaillée des pré-requis** :
  - Groupés par catégorie :
    - Préparation générale
    - Examens médicaux
    - Recommandations
    - Documentation
  - Chaque pré-requis affiche :
    - Icône de statut (✅ ou ⏳)
    - Titre de la tâche
    - Description détaillée
    - Style visuel différent selon le statut

### Utilité en réunion
- Vérifier rapidement si un point a été préparé
- Adapter les questions en fonction du travail déjà réalisé
- Éviter les répétitions ou les oublis
- Faciliter la communication ciblée

---

## 5. Visualisation avant la réunion (dans RCP Meetings)

### Description
Avant de rejoindre une réunion, l'état de préparation est visible directement sur la page "Réunions RCP".

### Affichage compact
- **Barre de progression globale** montrant la préparation de tous les participants
- **Avatars des participants** avec indicateurs de couleur (vert/ambre)
- **Compteur** "X/Y prêts" indiquant combien de participants sont préparés
- **Tooltip au survol** affichant le nom et le pourcentage de préparation

### Bénéfices
- Décision éclairée avant de rejoindre
- Possibilité de reporter si la préparation est insuffisante
- Visibilité sur l'état général de l'équipe

---

## Architecture technique

### Composants créés

#### 1. `ParticipantCard.tsx`
**Rôle** : Modal affichant les détails complets d'un participant et ses pré-requis

**Props** :
```typescript
interface ParticipantCardProps {
  participant: ParticipantWithPrerequisites | null;
  open: boolean;
  onClose: () => void;
}
```

**Fonctionnalités** :
- Calcul automatique du taux de complétion
- Groupement des pré-requis par catégorie
- Affichage conditionnel des badges de statut
- Scroll pour gérer de nombreux pré-requis

#### 2. `MeetingPreparationStatus.tsx`
**Rôle** : Composant affichant l'état de préparation des participants

**Props** :
```typescript
interface MeetingPreparationStatusProps {
  participants: ParticipantPreparation[];
  compact?: boolean;
}
```

**Modes d'affichage** :
- **Compact** (`compact={true}`) : Barre de progression + avatars avec tooltips
- **Détaillé** (`compact={false}`) : Liste complète avec accordéons par participant

**Fonctionnalités** :
- Calcul de la préparation globale
- Expansion/réduction des détails par participant
- Codes couleur pour identification rapide

#### 3. Modifications dans `VideoConferenceAdvanced.tsx`
**Ajouts** :
- Type `ParticipantWithPrerequisites` étendu avec pré-requis
- État `selectedParticipant` et `showParticipantCard`
- État `roleFilter` pour le filtrage par rôle
- Fonction `getParticipantReadiness()` pour calcul du taux
- Menu déroulant de filtrage par rôle
- Affichage des indicateurs de préparation dans la liste
- Ouverture du modal au clic sur un participant

#### 4. Modifications dans `RCPMeetings.tsx`
**Ajouts** :
- Données `participantsPreparation` pour chaque réunion
- Intégration du composant `MeetingPreparationStatus`
- Affichage compact avant de rejoindre

---

## Structure des données

### Prerequisite
```typescript
interface Prerequisite {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: string;
}
```

### ParticipantWithPrerequisites
```typescript
interface ParticipantWithPrerequisites {
  id: string;
  name: string;
  role: string;
  initials: string;
  active: boolean;
  micOn: boolean;
  videoOn: boolean;
  status: string;
  email?: string;
  specialization?: string;
  prerequisites: Prerequisite[];
}
```

---

## Guide d'utilisation

### Pour les participants

1. **Avant la réunion** :
   - Consulter la page "Réunions RCP"
   - Vérifier vos pré-requis dans la section "État de préparation"
   - Compléter les tâches en attente
   - S'assurer d'avoir le badge vert (100% prêt)

2. **Pendant la réunion** :
   - Accéder à l'onglet "Participants"
   - Cliquer sur un participant pour voir ses pré-requis
   - Adapter vos questions selon sa préparation
   - Utiliser le filtre par rôle pour organiser la discussion

### Pour les organisateurs

1. **Planification** :
   - Définir les pré-requis pour chaque rôle
   - Assigner les participants
   - Envoyer les notifications de préparation

2. **Suivi** :
   - Consulter l'état de préparation global
   - Relancer les participants en retard
   - Décider du maintien ou report de la réunion

3. **Pendant la réunion** :
   - Vérifier la présence et la préparation
   - Organiser la discussion par spécialité
   - S'assurer que tous les points préparés sont abordés

---

## Bonnes pratiques

### Définition des pré-requis
- ✅ Être spécifique et actionnable
- ✅ Catégoriser logiquement (Préparation, Examens, Recommandations, Documentation)
- ✅ Limiter à 3-5 pré-requis essentiels par participant
- ❌ Éviter les tâches trop vagues ou impossibles à vérifier

### Gestion de la préparation
- ✅ Consulter l'état 24h avant la réunion
- ✅ Relancer les participants à 50% ou moins
- ✅ Reporter si moins de 70% de préparation globale
- ✅ Documenter les raisons de non-préparation

### Utilisation en réunion
- ✅ Commencer par les participants 100% prêts
- ✅ Adapter le temps de discussion selon la préparation
- ✅ Noter les pré-requis non complétés pour suivi
- ✅ Utiliser le filtrage pour organiser par spécialité

---

## Évolutions futures possibles

### Court terme
- [ ] Notifications automatiques pour pré-requis en retard
- [ ] Rappels 48h et 24h avant la réunion
- [ ] Possibilité de marquer un pré-requis comme "non applicable"
- [ ] Statistiques de préparation par participant

### Moyen terme
- [ ] Génération automatique de pré-requis selon le type de RCP
- [ ] Modèles de pré-requis réutilisables
- [ ] Intégration avec le calendrier pour blocage de temps
- [ ] Export des statistiques de préparation

### Long terme
- [ ] IA suggérant des pré-requis selon le cas patient
- [ ] Analyse prédictive de la qualité de préparation
- [ ] Dashboard de performance par spécialité
- [ ] Gamification de la préparation

---

## Support et questions

Pour toute question concernant ces fonctionnalités :
- Consulter la section "Aide" dans l'application
- Accéder au guide interactif (icône ?)
- Contacter l'équipe support OncoCollab

---

**Version** : 1.0  
**Date de mise à jour** : Janvier 2026  
**Auteur** : Équipe OncoCollab
