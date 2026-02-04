# 🚀 Guide de Démarrage Rapide - OncoCollab

Bienvenue sur **OncoCollab**, votre plateforme de Réunion de Concertation Pluridisciplinaire (RCP) numérique !

## 📱 Première Connexion

### 1. Page de connexion

Lors du lancement de l'application, vous arriverez sur la page de connexion sécurisée OncoCollab.

**Comptes de démonstration disponibles :**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Radiologue | `radiologue@hopital.fr` | n'importe lequel |
| Oncologue | `oncologue@hopital.fr` | n'importe lequel |
| Chirurgien | `chirurgien@hopital.fr` | n'importe lequel |
| Pathologiste | `pathologiste@hopital.fr` | n'importe lequel |

> 💡 **Astuce** : En mode démo, vous pouvez utiliser n'importe quel email et mot de passe.

### 2. Connexion sécurisée

- ✅ Connexion SSL/TLS active
- ✅ Authentification OAuth2 / OpenID Connect (architecture)
- ✅ Session automatiquement expirée après 30 min d'inactivité
- ✅ Alerte 1 minute avant expiration

### 3. Mot de passe oublié ?

Cliquez sur **"Mot de passe oublié ?"** :
- Entrez votre email professionnel
- Recevez un lien sécurisé (valide 1h)
- Réinitialisez votre mot de passe

---

## 🏠 Tableau de Bord

Après connexion, vous accédez au **tableau de bord** avec :

### Vue d'ensemble
- **Statistiques clés** : Dossiers actifs, RCP planifiées, Rapports en attente, Équipe
- **Suggestions AgentIA** : Recommandations intelligentes
- **Dossiers récents** : Vos derniers patients
- **Prochaines RCP** : Réunions à venir
- **Activité du mois** : Progression des tâches
- **État du système** : Monitoring en temps réel

### Actions rapides
- 📅 **Planifier une RCP** → Accès au calendrier
- 📁 **Nouveau dossier** → Création de dossier patient

---

## 📋 Navigation Principale

### Barre latérale gauche

1. **🏠 Tableau de bord** - Vue d'ensemble
2. **👥 Patients** - Gestion des dossiers patients
3. **📅 Calendrier RCP** - Planification avec IA
4. **📄 Mes Documents** - Espace de travail (badge jaune = 3 à valider)
5. **🎥 Réunions** - Liste des RCP
6. **💬 Messagerie** - Communication inter-équipe
7. **🤖 AgentIA** - Assistant intelligent (point bleu = suggestions actives)

### Section Support
8. **❓ Aide** - Guides et tutoriels
9. **⚙️ Paramètres** - Configuration profil

### Indicateur sécurité (bas de sidebar)
- 🟢 **Connexion sécurisée** - SSL/TLS actif

---

## 👥 Gestion des Patients

### Créer un nouveau dossier

1. Cliquez sur **"Patients"** dans la sidebar
2. Cliquez **"Nouveau dossier patient"**
3. Remplissez :
   - Nom, Prénom, Date de naissance
   - Type de cancer
   - Documents médicaux
4. Définissez le statut : **En attente** / **En cours** / **Validé**
5. Cliquez **"Créer"**

### Consulter un dossier

1. Cliquez sur un dossier dans la liste
2. Accédez à :
   - **Infos Patient** - Données personnelles
   - **Documents** - Rapports et analyses
   - **Examens** - Imageries DICOM
   - **Historique** - Modifications et événements

### Badges de statut

- 🟡 **En attente** - Nouveau dossier
- 🔵 **En cours** - Traitement actif
- 🟢 **Validé** - Finalisé

---

## 📅 Calendrier & Planification

### Planifier une RCP

1. Allez dans **"Calendrier RCP"**
2. Cliquez **"Nouvelle RCP"**
3. L'**AgentIA** vous suggère les meilleurs créneaux
4. Sélectionnez une date ou cliquez **"Planifier"** sur une suggestion
5. Les participants reçoivent une notification

### Planification Assistée par IA

Le panel de droite affiche :
- **Suggestions de créneaux** avec taux de disponibilité
- **Participants** avec statut (Confirmé / En attente / Refusé)
- **Invitations** et rappels automatiques

### Synchronisation

Synchronisez avec :
- 📅 **Google Calendar**
- 📅 **Outlook**

Boutons disponibles en haut du calendrier.

### Notifications automatiques

- 📧 24h avant la réunion
- 📧 1h avant la réunion
- 📧 Confirmation d'inscription
- 🔔 Nouveau dossier ajouté

---

## 🎥 Rejoindre une Réunion RCP

### Étapes

1. Allez dans **"Calendrier"** ou **"Réunions"**
2. Cliquez sur la réunion prévue
3. Cliquez **"Rejoindre la réunion"**
4. Vérifiez vos paramètres audio/vidéo
5. Entrez dans la salle

### Interface de visioconférence

**Sidebar gauche - Dossier Patient**
- 📋 Infos Patient
- 📄 Documents
- 🖼️ **Examens** (imageries DICOM)
- 🕐 Historique

**Centre - Zone principale**
- 🎥 Vidéo des participants
- 🖼️ **Imagerie médicale** affichée en grand
- 🔧 **Toolbar d'annotation** :
  - ↖️ Curseur
  - ✏️ Crayon
  - 🔤 Texte
  - ⬜ Rectangle
- 🔍 Zoom In/Out
- ⤢ Plein écran
- 💡 **Suggestions IA** : "Zone suspecte détectée"

**Sidebar droite - Collaboration**
- 💬 **Chat** - Messages archivés
- 👥 **Participants** - Statuts micro/caméra
- 📎 **Documents** - Partagés en temps réel
- 📤 **Partage** - Écran

**Contrôles bas**
- 🎤 Micro On/Off
- 🎥 Caméra On/Off
- 📤 Partager écran
- 💬 Afficher/Masquer chat
- 📞 Raccrocher (rouge)

---

## 📄 Espace de Travail Documentaire

### Mes Documents

Accédez via **"Mes Documents"** dans la sidebar.

**Statistiques**
- 📊 Mes Documents : 24
- 🔗 Partagés avec moi : 12
- ⏰ Rapports à valider : 3 (badge jaune)

### Actions

**Recherche**
- 🔍 Barre de recherche par nom, patient, contenu

**Filtres**
- 📁 **Type** : Rapport, Analyse, Protocole
- 🏷️ **Statut** : Validé, En attente, Partagé

**Tableau des documents**
| Colonne | Description |
|---------|-------------|
| Nom du document | Titre du fichier |
| Patient | Nom du patient |
| Dernière modification | Date |
| Statut | Badge coloré |
| Actions | Détails / Valider |

### Rapports à valider (sidebar droite)

Panel jaune avec compteur :
- Cliquez **"Voir"** pour ouvrir
- Cliquez **"Valider"** pour approuver

### Stockage

Indicateur en bas :
- **2.4 GB / 10 GB** utilisés
- ✅ Sauvegarde quotidienne automatique activée

---

## 🤖 AgentIA - Assistant Intelligent

### Fonctionnalités

**Planification automatique**
- Analyse les disponibilités
- Propose les meilleurs créneaux
- Envoie les invitations

**Création de canaux**
- Canal dédié par patient
- Ajout auto des spécialistes concernés
- Inclusion du dossier complet

**Analyse d'imagerie**
- Détection de zones suspectes
- Annotations suggérées
- Validation par spécialiste

**Recommandations**
- Ajoute participants pertinents
- Suggère actions (compléter dossier, etc.)

**Génération de rapports**
- Synthèse automatique des décisions
- Intégration des annotations
- Envoi pour validation finale
- Suivi post-RCP

### Accéder à AgentIA

1. Cliquez **"AgentIA"** dans la sidebar (point bleu animé)
2. Consultez les suggestions
3. Cliquez **"Accepter"** / **"Lancer"** sur les actions

---

## ❓ Centre d'Aide

Accessible via **"Aide"** dans la sidebar.

### Onglets

**📚 Guides rapides**
- Comment rejoindre une réunion (2 min)
- Comment créer un dossier patient (3 min)
- Comment partager des documents (2 min)
- Comment annoter une imagerie (3 min)

Chaque guide :
- ✅ Étapes numérotées
- ⏱️ Durée estimée
- 🎯 Bouton "Suivre le guide"

**🎬 Tutoriels vidéo**
- Vue d'ensemble OncoCollab (5:30)
- Organiser une RCP complète (8:15)
- Utiliser l'assistant IA (4:45)
- Annotations collaboratives (6:20)

**❓ FAQ**
- Réinitialisation mot de passe
- Déconnexion automatique
- Suggestions IA
- Chat archivé
- Synchronisation calendriers
- Annotations IA

**📞 Support**
- Contacter le support
- Signaler un problème
- Télécharger guide PDF complet

---

## ⚙️ Paramètres

### Mon Profil

- 👤 Modifier informations
- 🔐 Changer mot de passe
- 📧 Email de notification

### Préférences

- 🌙 Thème : Clair / **Sombre** (actuel)
- 🔔 Notifications activées
- 🗣️ Langue : Français

### Sécurité

- 🕐 **Historique des connexions**
- 🔐 Sessions actives
- 🔒 Authentification à deux facteurs (à venir)

### Intégrations

- 📅 Synchronisation calendriers
- 🔗 API externes
- 🤖 AgentIA activé

---

## 🔒 Sécurité & Bonnes Pratiques

### Session

- ⏱️ **Expiration automatique** après 30 min
- ⚠️ **Alerte** 1 minute avant expiration
- 🔄 **Réinitialisation** automatique du timer à chaque action

### Données

- 🔐 **SSL/TLS** pour toutes les communications
- 💾 **Sauvegarde automatique** quotidienne
- 📝 **Traçabilité** complète des actions
- 🗂️ **Archivage** des conversations par dossier

### Recommandations

1. ✅ Ne jamais partager vos identifiants
2. ✅ Déconnectez-vous après chaque session
3. ✅ Vérifiez le badge SSL/TLS (sidebar)
4. ✅ Validez régulièrement vos rapports
5. ✅ Consultez l'historique des modifications

---

## 📊 Indicateurs de Statut

### Système (Dashboard)

- 🟢 **Serveurs** : Opérationnel
- 🟢 **Sauvegarde** : Actif
- 🟢 **AgentIA** : En ligne

### Dossiers

- 🟡 **En attente** : Nouveau ou incomplet
- 🔵 **En cours** : Traitement actif
- 🟢 **Validé** : Finalisé et archivé

### Réunions

- 🟢 **Confirmé** : Tous les participants OK
- 🟡 **En attente** : Confirmations manquantes
- 🔴 **Annulé** : Réunion annulée

---

## 💡 Astuces & Raccourcis

### Navigation rapide

- **Ctrl+K** : Barre de recherche globale (à venir)
- **Clic sur badge jaune** : Accès direct rapports à valider
- **Clic sur suggestion IA** : Action immédiate

### Dashboard

- **Cards cliquables** : Accès direct aux sections
- **Graphiques de progression** : Suivi activité
- **Suggestions IA** : Acceptation en 1 clic

### Visioconférence

- **Espace** : Mute/Unmute micro (à venir)
- **V** : Toggle vidéo (à venir)
- **C** : Afficher/Masquer chat (à venir)

### Productivité

1. 📌 **Épinglez** vos dossiers fréquents
2. 🔔 **Activez** les notifications de rappel
3. 🤖 **Utilisez** les suggestions IA
4. 📅 **Synchronisez** vos calendriers
5. 📄 **Validez** rapidement les rapports

---

## 🆘 Besoin d'Aide ?

### Ressources disponibles

1. **Centre d'aide** : Onglet "Aide" → Guides, Vidéos, FAQ
2. **Support technique** : Bouton "Contacter le support"
3. **Signaler un problème** : Formulaire dédié
4. **Guide PDF** : Téléchargeable depuis l'aide

### Support rapide

- 📧 Email : support@oncocollab.fr (fictif)
- 📞 Téléphone : +33 X XX XX XX XX (fictif)
- 💬 Chat : Disponible 24/7 (fictif)

---

## ✨ Profitez d'OncoCollab !

Vous êtes maintenant prêt à utiliser **OncoCollab** pour vos Réunions de Concertation Pluridisciplinaire.

**Fonctionnalités clés à explorer :**

1. 🎥 **Visioconférence** avec imagerie intégrée
2. 🤖 **AgentIA** pour planification intelligente
3. 📄 **Workspace** collaboratif
4. 📅 **Calendrier** avec synchronisation
5. 📊 **Dashboard** avec statistiques en temps réel

---

**OncoCollab** - Collaboration médicale intelligente 🏥

*Pour toute question, consultez le centre d'aide ou contactez le support.*
