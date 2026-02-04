# OncoCollab - User Stories Complètes et Détaillées

Version: 2.0 - Mise à jour Juin 2024

---

## EPIC 1 : Authentification et Sécurité

### User Story 1.1 – Connexion sécurisée avec OTP
**En tant qu'** utilisateur médical (médecin, spécialiste, coordinateur, administrateur),  
**Je veux** me connecter via un système sécurisé avec email professionnel + mot de passe, avec option d'authentification à deux facteurs (2FA/OTP),  
**Afin de** garantir la confidentialité et la sécurité des données médicales sensibles.

#### Sous-tâches :
- ✅ Authentification via OAuth2 / OpenID Connect
- ✅ Gestion du mot de passe chiffré (bcrypt/Argon2)
- ✅ **Authentification OTP (One-Time Password) par email ou SMS**
  - Code à 6 chiffres valide pendant 5 minutes
  - Obligatoire pour les connexions depuis nouveaux appareils
  - Possibilité d'activer/désactiver dans les paramètres
- ✅ Déconnexion automatique après 30 minutes d'inactivité
- ✅ Historique des connexions (logs sécurisés avec IP, appareil, localisation)
- ✅ Réinitialisation de mot de passe sécurisée (lien temporaire par email)
- ✅ Chiffrement SSL/TLS pour toutes les communications
- ✅ Blocage automatique après 5 tentatives échouées

#### Critères d'acceptation :
- L'utilisateur reçoit un code OTP lors de connexion depuis nouvel appareil
- Le système envoie un email d'alerte lors de connexion inhabituelle
- Les mots de passe respectent la politique de sécurité (12+ caractères, majuscules, chiffres, caractères spéciaux)

---

### User Story 1.2 – Gestion des sessions et des rôles
**En tant qu'** administrateur système,  
**Je veux** que chaque session soit limitée dans le temps et que les rôles utilisateurs soient strictement définis,  
**Afin de** contrôler précisément les accès aux fonctionnalités selon les responsabilités médicales.

#### Sous-tâches :
- ✅ Expiration automatique des sessions après 30 minutes d'inactivité
- ✅ Avertissement à 29 minutes avant expiration
- ✅ Rôles définis : Radiologue, Oncologue, Chirurgien, Pathologiste, Radiothérapeute, Coordinateur RCP, Administrateur
- ✅ Permissions granulaires par rôle (lecture, écriture, suppression, validation)
- ✅ Notifications de sécurité :
  - Connexion depuis un nouvel appareil
  - Modification de mot de passe
  - Tentative de connexion échouée
- ✅ Journal d'audit complet de toutes les actions utilisateurs

#### Critères d'acceptation :
- Chaque rôle ne peut accéder qu'aux fonctionnalités autorisées
- Les logs de sécurité sont consultables par les administrateurs
- L'utilisateur est notifié de toute activité suspecte sur son compte

---

## EPIC 2 : Visioconférence et Collaboration en Temps Réel

### User Story 2.1 – Visioconférence intégrée avec partage d'imagerie
**En tant que** participant à une RCP,  
**Je veux** rejoindre une visioconférence sécurisée avec partage d'écran, de documents et d'imagerie médicale en temps réel,  
**Afin de** collaborer efficacement avec mes collègues sur les dossiers patients.

#### Sous-tâches :
- ✅ Lien de réunion unique sécurisé (crypté end-to-end)
- ✅ Partage d'écran et de fenêtres spécifiques
- ✅ Partage de documents médicaux (PDF, DOCX, DICOM)
- ✅ Visualisation synchronisée d'imagerie médicale
- ✅ **Annotations en temps réel sur imagerie** (cercles, flèches, texte, mesures)
- ✅ Indicateur de statut de réunion (en attente / en cours / terminée)
- ✅ Section "Guide d'accès à la visio" intégrée
- ✅ **Qualité vidéo adaptative** (ajustement automatique selon bande passante)
- ✅ **Enregistrement de session** (avec consentement des participants)

#### Nouvelles fonctionnalités avancées :
- ✅ **Lever la main** : Demande de prise de parole
- ✅ **Réactions en temps réel** : 👍 ❤️ 👏 (comme Teams/Zoom)
- ✅ **Mode présentateur** : Mise en avant d'un intervenant
- ✅ **Arrière-plan flou** : Option de confidentialité
- ✅ **Sous-titres en temps réel** : Transcription automatique affichée

#### Critères d'acceptation :
- Maximum 20 participants simultanés
- Latence < 200ms pour les annotations
- Enregistrement sauvegardé dans le dossier patient

---

### User Story 2.2 – Chat intégré avec réactions et historique
**En tant que** participant,  
**Je veux** échanger des messages dans un chat latéral avec possibilité de réagir aux messages,  
**Afin de** poser des questions sans interrompre la discussion, et retrouver facilement l'historique.

#### Sous-tâches :
- ✅ Chatbox intégré à la visioconférence
- ✅ **Réactions sur messages** : 👍 ❤️ 😊 🎉 ✅ ❌ (comme WhatsApp, Instagram, Slack)
- ✅ **Répondre à un message spécifique** (threading)
- ✅ **Mentions** : @nom pour notifier un participant
- ✅ **Partage de fichiers** dans le chat (drag & drop)
- ✅ Sauvegarde automatique des conversations par dossier patient
- ✅ **Recherche dans l'historique** avec filtres (date, auteur, mots-clés)
- ✅ **Messages épinglés** : Garder les informations importantes visibles
- ✅ **Indicateurs de lecture** : "Lu par 3/4 participants"

#### Critères d'acceptation :
- Les réactions s'affichent en temps réel pour tous les participants
- L'historique est accessible même après la fin de la réunion
- Les fichiers partagés sont sauvegardés dans le dossier patient

---

### User Story 2.3 – Documents personnels et partagés avec agent IA vocal
**En tant que** spécialiste,  
**Je veux** avoir un espace personnel pour mes documents et un espace partagé pour construire le compte-rendu collaboratif, avec assistance d'un agent IA vocal,  
**Afin de** organiser efficacement les informations et rédiger rapidement pendant la réunion.

#### Sous-tâches :
- ✅ **Zone "Documents personnels"** par utilisateur (privée)
  - Notes personnelles
  - Brouillons
  - Documents de référence personnels
- ✅ **Dossier "Document général"** modifiable par tous les participants
  - Compte-rendu collaboratif en temps réel
  - Édition simultanée (comme Google Docs)
  - Historique des modifications avec auteur et timestamp
- ✅ **Agent IA vocal type Siri/Alexa** :
  - Activation par commande vocale : "Agent IA, rédige..."
  - Transcription automatique des instructions orales
  - Rédaction intelligente basée sur les discussions
  - **Écoute active** : L'agent analyse les conversations et suggère des contenus à ajouter
  - Confirmation avant ajout au document
- ✅ **Gestion des versions** avec possibilité de restauration
- ✅ **Commentaires et annotations** sur documents
- ✅ **Possibilité d'annotation** (texte, dessin, sur image DICOM)
- ✅ **Suggestions IA** d'analyse sur imagerie médicale
- ✅ **Modification manuelle** : Les spécialistes peuvent toujours éditer/corriger les propositions IA

#### Nouvelles fonctionnalités :
- ✅ **Commandes vocales IA** :
  - "Agent IA, ajoute cette décision au compte-rendu"
  - "Agent IA, résume les points clés de la discussion"
  - "Agent IA, génère la liste des actions à réaliser"
- ✅ **Mode dictée** : Transcription continue pour rédaction rapide
- ✅ **Détection automatique de dates** : L'IA propose d'ajouter au calendrier
  - Exemple : "Prochaine RCP le 25 juin" → notification "Ajouter au calendrier ?"

#### Critères d'acceptation :
- L'agent IA détecte et suggère automatiquement les informations pertinentes
- Les suggestions IA sont toujours modifiables manuellement
- Toutes les versions des documents sont sauvegardées
- L'édition collaborative fonctionne sans conflit de versions

---

### User Story 2.4 – Fenêtre de call flottante
**En tant que** utilisateur,  
**Je veux** pouvoir minimiser la visioconférence en une fenêtre flottante déplaçable,  
**Afin de** naviguer dans la plateforme (consulter dossiers, imagerie, calendrier) tout en restant en communication.

#### Sous-tâches :
- ✅ **Mini fenêtre de call** style Teams/Meet
- ✅ **Déplaçable** par drag & drop n'importe où sur l'écran
- ✅ **Redimensionnable** (petit, moyen, maximisé)
- ✅ Affichage des participants actifs (miniatures)
- ✅ Contrôles de base accessibles (micro, caméra, raccrocher)
- ✅ Indicateur de durée d'appel
- ✅ **Toujours au premier plan** (option activable)
- ✅ Bouton pour revenir en plein écran

#### Critères d'acceptation :
- La fenêtre flottante reste visible sur toutes les pages de l'application
- Les contrôles sont toujours accessibles
- La position est mémorisée entre les sessions

---

## EPIC 3 : Planification Intelligente et Calendrier

### User Story 3.1 – Calendrier avec disponibilités et synchronisation externe
**En tant que** coordinateur RCP,  
**Je veux** consulter et gérer les disponibilités de tous les participants avec synchronisation des calendriers externes,  
**Afin de** planifier efficacement les RCP sans conflits d'horaires.

#### Sous-tâches :
- ✅ Calendrier intégré avec vue jour/semaine/mois
- ✅ Indication de disponibilité de chaque spécialiste (disponible / occupé / absent)
- ✅ **Synchronisation bidirectionnelle** :
  - Google Calendar
  - Outlook Calendar
  - Apple Calendar
  - Autres via CalDAV/iCal
- ✅ **Import automatique** des créneaux occupés depuis calendriers externes
- ✅ **Export automatique** des RCP planifiées vers calendriers personnels
- ✅ Propositions automatiques de dates par l'IA
- ✅ **Gestion des conflits** : Alertes si participants indisponibles
- ✅ **Plages horaires privilégiées** : Configuration par utilisateur

#### Critères d'acceptation :
- La synchronisation se fait en temps réel (<5 min de délai)
- Les modifications dans les calendriers externes sont reflétées dans OncoCollab
- L'utilisateur peut désactiver la synchronisation pour certains calendriers

---

### User Story 3.2 – Notifications et rappels intelligents
**En tant qu'** utilisateur,  
**Je veux** recevoir des notifications et rappels personnalisés pour les réunions et tâches importantes,  
**Afin de** ne jamais manquer un événement critique.

#### Sous-tâches :
- ✅ **Rappels de réunion** :
  - 24 heures avant
  - 1 heure avant
  - 10 minutes avant (notification push)
- ✅ **Notifications contextuelles** :
  - "Nouveau dossier ajouté à la RCP de demain"
  - "Dossier en attente de validation"
  - "Dr. X a commenté le compte-rendu"
  - "Nouvelle imagerie disponible pour patient Y"
- ✅ **Canaux de notification** :
  - In-app (pop-up dans la plateforme)
  - Email professionnel
  - Notifications push navigateur
  - Optionnel : SMS pour urgences
- ✅ **Mail de confirmation** d'inscription à une réunion avec lien iCal
- ✅ **Préférences de notification** : L'utilisateur choisit ce qu'il veut recevoir
- ✅ **Mode "Ne pas déranger"** : Désactivation temporaire des notifications

#### Critères d'acceptation :
- Les notifications sont envoyées de manière fiable
- L'utilisateur peut personnaliser complètement ses préférences
- Les notifications contiennent des liens directs vers l'élément concerné

---

### User Story 3.3 – Détection automatique de dates et création d'événements
**En tant qu'** agent IA,  
**Je veux** détecter automatiquement les dates mentionnées dans les conversations et proposer de les ajouter au calendrier,  
**Afin de** faciliter la planification sans saisie manuelle.

#### Sous-tâches :
- ✅ **Détection NLP** de dates dans :
  - Messages de chat
  - Discussions vidéo (transcription)
  - Comptes-rendus
- ✅ **Analyse contextuelle** :
  - "RCP de suivi dans 3 semaines" → Détection du type d'événement
  - "Prochaine consultation le 15 juin" → Date spécifique
  - "Programmer l'intervention rapidement" → Proposition de plages disponibles
- ✅ **Notification intelligente** :
  - "📅 Souhaitez-vous ajouter 'RCP Mme. Dupont' le 15/06/2024 à 14h00 ?"
  - Boutons : "Ajouter" / "Modifier" / "Ignorer"
- ✅ **Pré-remplissage automatique** :
  - Titre (nom patient + type d'événement)
  - Participants suggérés (basé sur spécialités nécessaires)
  - Durée estimée

#### Critères d'acceptation :
- L'IA détecte correctement les dates avec >90% de précision
- L'utilisateur peut toujours modifier avant validation
- Les faux positifs peuvent être ignorés définitivement

---

## EPIC 4 : Gestion Avancée des Dossiers Patients

### User Story 4.1 – Création et gestion des dossiers avec historique complet
**En tant qu'** utilisateur médical,  
**Je veux** créer, consulter, modifier et supprimer des dossiers patients avec traçabilité complète,  
**Afin de** suivre efficacement le parcours clinique de chaque patient.

#### Sous-tâches :
- ✅ **Création de dossier patient** avec formulaire structuré
- ✅ Modification avec validation et confirmation
- ✅ Suppression sécurisée (soft delete avec possibilité de restauration)
- ✅ **Statuts de dossier** :
  - 🟡 "En attente" : Nouveau cas à évaluer
  - 🔵 "En cours" : Traitement actif
  - ✅ "Validé" : Décision prise et validée
  - 📦 "Archivé" : Patient traité ou suivi terminé
- ✅ **Historique complet** avec :
  - Toutes les modifications (quoi, par qui, quand)
  - Versions précédentes des documents
  - Timeline des événements (consultations, examens, RCP)
- ✅ **Recherche avancée** avec filtres multiples :
  - Nom, ID patient
  - Type de cancer
  - Statut
  - Date de création
  - Spécialiste référent

#### Critères d'acceptation :
- Toute modification est tracée et consultable
- Les versions précédentes peuvent être comparées
- La suppression nécessite confirmation et justification

---

### User Story 4.2 – Ajout et gestion d'imageries avec annotations IA
**En tant que** radiologue,  
**Je veux** ajouter, visualiser, annoter des imageries médicales avec assistance IA,  
**Afin de** partager efficacement mes observations lors des RCP.

#### Sous-tâches :
- ✅ **Import de fichiers DICOM** (CT, IRM, PET-Scan)
- ✅ **Visualisation avancée** :
  - Navigation entre coupes (axiale, coronale, sagittale)
  - Zoom et pan
  - Réglage fenêtre/niveau (windowing)
  - Mesure de distances et surfaces
- ✅ **Annotations collaboratives** :
  - Dessin libre (pinceau, marqueur)
  - Formes (cercle, rectangle, flèche)
  - Texte et étiquettes
  - Calques superposables
- ✅ **Suggestions IA** :
  - Détection automatique de zones suspectes
  - Segmentation tumorale
  - Mesures automatiques
  - Comparaison avec examens précédents
- ✅ **Gestion des suggestions IA** :
  - Les spécialistes peuvent valider, ajuster ou rejeter
  - Possibilité de conserver une partie du calque IA
  - **Toutes les suggestions sont sauvegardées** même si rejetées (pour analyse future)
- ✅ Suppression / mise à jour d'une imagerie avec versioning
- ✅ **Export** des images annotées (PNG, PDF)

#### Critères d'acceptation :
- Support DICOM complet (tous les formats standards)
- Les annotations sont sauvegardées en temps réel
- Les suggestions IA sont traçables et modifiables

---

### User Story 4.3 – Documents par spécialité avec partage sélectif
**En tant que** spécialiste,  
**Je veux** disposer d'un espace dédié pour mes documents avec partage sélectif,  
**Afin de** organiser mes fichiers tout en collaborant efficacement.

#### Sous-tâches :
- ✅ **Espace "Documents personnels"** pour chaque rôle :
  - Radiologue : Comptes-rendus d'imagerie
  - Oncologue : Protocoles de traitement
  - Chirurgien : Notes opératoires
  - Pathologiste : Résultats histologiques
- ✅ **Partage sélectif** :
  - Partage avec utilisateurs spécifiques
  - Partage avec groupes (ex: "Équipe oncologie thoracique")
  - Droits granulaires (lecture seule / édition / commentaire)
- ✅ **Accès rapide** depuis le tableau de bord
- ✅ **Organisation** par dossiers et tags
- ✅ **Recherche** plein texte dans les documents (OCR pour PDF scannés)
- ✅ **Notifications** lors de nouveaux documents partagés

#### Critères d'acceptation :
- Les documents non partagés restent strictement privés
- Le propriétaire garde le contrôle total sur les permissions
- La recherche inclut le contenu des PDF

---

## EPIC 5 : Agent IA Intelligent et Automatisations

### User Story 5.1 – Création automatique de canaux patients
**En tant qu'** agent IA,  
**Je veux** créer automatiquement un canal dédié pour chaque patient confirmé avec cancer,  
**Afin de** centraliser toutes les communications et documents le concernant.

#### Sous-tâches :
- ✅ **Détection automatique** :
  - Lors de validation d'un diagnostic de cancer dans le système
  - Déclenchement instantané de la création du canal
- ✅ **Configuration automatique du canal** :
  - Nom : "Mme. DUPONT Marie - Cancer du sein triple négatif"
  - Description : Résumé du diagnostic, stade, date de confirmation
  - Type de cancer en évidence
- ✅ **Ajout automatique des spécialistes pertinents** selon le type de cancer :
  - Cancer du sein → Oncologue médical, Chirurgien, Radiologue, Radiothérapeute
  - Cancer du poumon → Oncologue, Pneumologue, Chirurgien thoracique, Radiologue
  - Glioblastome → Neurochirurgien, Neuro-oncologue, Radiothérapeute, Radiologue
  - Règles configurables par type de pathologie
- ✅ **Import automatique** du dossier complet :
  - Toutes les imageries
  - Documents médicaux existants
  - Historique médical
  - Résultats d'examens

#### Nouvelles fonctionnalités de gestion manuelle :
- ✅ **Création manuelle** de canal si besoin
- ✅ **Ajout/retrait manuel** de participants
- ✅ **Modification** du nom, description, type de cancer
- ✅ **Archivage automatique** :
  - Lorsque le statut patient passe à "Traité" ou "Rémission complète"
  - Notification à l'équipe avant archivage
  - Les canaux archivés restent consultables
- ✅ **Barre de recherche** dans les canaux :
  - Recherche par nom de patient
  - Recherche par type de cancer
  - Recherche par ID patient
  - **Intégration ElasticSearch** pour recherche full-text performante dans tous les messages et documents

#### Critères d'acceptation :
- Les canaux sont créés en moins de 5 secondes après validation du diagnostic
- Les bons spécialistes sont ajoutés automatiquement (>95% de précision)
- Les canaux archivés restent accessibles en lecture seule
- La recherche retourne des résultats en <1 seconde

---

### User Story 5.2 – Suggestions intelligentes et planification automatisée
**En tant qu'** agent IA,  
**Je veux** analyser les disponibilités, historiques et contextes pour proposer des planifications et suggestions optimales,  
**Afin d'** optimiser le temps des médecins et améliorer l'efficacité des RCP.

#### Sous-tâches :
- ✅ **Planification de réunions optimisée** :
  - Analyse des calendriers de tous les participants nécessaires
  - Calcul des créneaux communs disponibles
  - Prise en compte des préférences horaires (matinée/après-midi)
  - Détection des conflits et proposition d'alternatives
  - Envoi automatique de propositions avec vote possible
- ✅ **Suggestions d'analyse sur imagerie** :
  - Détection automatique de zones suspectes
  - Segmentation tumorale avec calcul de volume
  - Comparaison avec examens précédents (évolution)
  - Proposition d'angles de coupe optimaux
- ✅ **Validation/Ajustement par les spécialistes** :
  - Interface dédiée pour accepter/refuser les suggestions
  - Modification partielle possible (garder une partie du calque IA)
  - Historique des validations pour traçabilité réglementaire
- ✅ **Recommandations sur les participants** :
  - "Suggestion : Ajouter Dr. X (spécialiste du cancer du poumon) à cette RCP"
  - Basé sur le type de cancer, les imageries présentes, le contexte
- ✅ **Propositions d'actions supplémentaires** :
  - "Document manquant : Compte-rendu anatomopathologique"
  - "Examens complémentaires suggérés : TEP-Scan"
  - "Prochaine RCP de suivi recommandée dans 6 semaines"

#### Critères d'acceptation :
- Les créneaux proposés conviennent à 100% des participants obligatoires
- Les suggestions d'imagerie sont validées par les radiologues dans >80% des cas
- Toutes les suggestions IA sont explicables (pas de boîte noire)

---

### User Story 5.3 – Transcription automatique et génération de comptes-rendus
**En tant qu'** agent IA,  
**Je veux** noter automatiquement tous les échanges lors de la réunion et générer un compte-rendu structuré,  
**Afin de** libérer les médecins de la prise de notes et garantir une documentation complète.

#### Sous-tâches :
- ✅ **Transcription vocale en temps réel** :
  - Reconnaissance vocale multi-locuteurs
  - Identification automatique des intervenants
  - Horodatage précis de chaque intervention
  - Support français médical (terminologie spécialisée)
- ✅ **Analyse sémantique intelligente** :
  - Détection des décisions prises
  - Identification des actions à réaliser
  - Extraction des dates et délais
  - Repérage des zones de débat/désaccord
- ✅ **Génération automatique du compte-rendu structuré** :
  - **Résumé exécutif** : Synthèse en 2-3 phrases
  - **Participants** : Liste complète avec rôles
  - **Cas discuté** : Nom patient, ID, pathologie
  - **Examens présentés** : Liste des imageries et documents partagés
  - **Discussion** : Points clés abordés
  - **Décisions thérapeutiques** : Protocole retenu, argumentaire
  - **Actions à réaliser** : Qui fait quoi, pour quand
  - **Prochaines étapes** : Suivi, examens complémentaires, prochaine RCP
- ✅ **Envoi automatique au canal du patient** :
  - Dès la fin de la réunion (ou sur validation manuelle)
  - Notification à tous les membres de l'équipe
  - Accessible immédiatement dans l'historique
- ✅ **Format export** : PDF professionnel avec logo, en-tête, mise en page médicale
- ✅ **Révision manuelle** : Les spécialistes peuvent relire et modifier avant envoi définitif

#### Critères d'acceptation :
- Transcription avec >95% de précision sur terminologie médicale
- Compte-rendu généré en <30 secondes après fin de réunion
- Possibilité de régénérer avec instructions spécifiques
- Le format respecte les normes de documentation médicale

---

### User Story 5.4 – Rappels et suivi post-RCP
**En tant qu'** agent IA,  
**Je veux** suivre l'avancement des actions décidées en RCP et envoyer des rappels intelligents,  
**Afin de** garantir que toutes les décisions sont effectivement mises en œuvre.

#### Sous-tâches :
- ✅ **Suivi automatique des actions** :
  - Détection des tâches dans le compte-rendu
  - Attribution automatique aux bonnes personnes
  - Suivi de l'état (À faire / En cours / Terminé)
- ✅ **Rappels intelligents** :
  - Notification 3 jours avant l'échéance
  - Rappel le jour J
  - Alerte si retard
- ✅ **Notifications de validation du rapport** :
  - Envoi aux participants pour validation
  - Relances si non validé après 48h
- ✅ **Tâches non complétées** :
  - Apparaissent dans un tableau de bord dédié
  - Escalade automatique au coordinateur si retard important
- ✅ **Historisation complète** :
  - Tout est tracé dans le dossier patient
  - Génération de métriques (taux de complétion, délais moyens)

#### Critères d'acceptation :
- Aucune action ne peut être "oubliée"
- Les rappels sont pertinents et non intrusifs
- Le taux de complétion des actions augmente de >30%

---

## EPIC 6 : Interface et Expérience Utilisateur

### User Story 6.1 – Interface ergonomique, responsive et multilingue
**En tant qu'** utilisateur,  
**Je veux** une interface fluide, moderne et adaptée à tous mes appareils,  
**Afin de** travailler efficacement en consultation, au bureau ou à domicile.

#### Sous-tâches :
- ✅ **Thèmes** :
  - Mode clair : Fond blanc/gris clair, adapté à environnements bien éclairés
  - Mode sombre : Fond noir/gris foncé, confort visuel en faible luminosité
  - Thème automatique selon l'heure (7h-19h clair, 19h-7h sombre)
  - Persistance des préférences
- ✅ **Navigation mobile-friendly** :
  - Responsive design (tablette, smartphone)
  - Sidebar collapsible sur mobile
  - Gestes tactiles (swipe, pinch-to-zoom sur imagerie)
- ✅ **Tableau de bord avec filtres** :
  - Vue synthétique des dossiers (en cours / en attente / terminés / archivés)
  - Filtres multiples (date, spécialité, urgence, statut)
  - Tri configurable
  - Widgets personnalisables
- ✅ **Barre de recherche globale** :
  - Accessible depuis toutes les pages (raccourci : Ctrl+K)
  - Recherche dans : dossiers patients, documents, imageries, messages, utilisateurs
  - Filtres contextuels
  - Historique des recherches
- ✅ **Paramètres détaillés** :
  - **Langue** : Français, Anglais, Espagnol, Allemand, Italien
  - Thème (clair/sombre/auto)
  - Notifications (préférences granulaires)
  - Synchronisation calendriers
  - Confidentialité et données
  - Raccourcis clavier personnalisables

#### Critères d'acceptation :
- L'interface s'adapte parfaitement sur écrans de 320px à 4K
- Le changement de thème est instantané sans rechargement
- La recherche retourne des résultats en <500ms

---

### User Story 6.2 – Guide d'utilisation et aide intégrée
**En tant que** nouvel utilisateur,  
**Je veux** un guide interactif clair et une aide contextuelle,  
**Afin de** comprendre rapidement comment utiliser la plateforme.

#### Sous-tâches :
- ✅ **Page "Comment rejoindre une réunion"** :
  - Instructions pas à pas avec captures d'écran
  - Vidéo de démonstration
  - FAQ des problèmes courants (micro, caméra, connexion)
- ✅ **Aide contextuelle** :
  - Info-bulles (tooltips) sur tous les boutons/fonctionnalités
  - Tutoriel pas à pas (wizard) au premier lancement
  - Liens "En savoir plus" vers documentation détaillée
- ✅ **Centre d'aide** avec recherche :
  - Articles classés par catégorie
  - Recherche plein texte
  - Tutoriels vidéo
- ✅ **Onboarding interactif** :
  - Visite guidée à la première connexion
  - Checklist de configuration
  - Bouton "Afficher les astuces du jour"

#### Critères d'acceptation :
- 90% des nouveaux utilisateurs réussissent à rejoindre une visio sans aide externe
- Le guide est accessible en 1 clic depuis n'importe quelle page
- Les tutoriels sont à jour avec les dernières fonctionnalités

---

### User Story 6.3 – Résilience et sauvegarde automatique
**En tant qu'** administrateur système,  
**Je veux** garantir la stabilité et la sécurité des données via des sauvegardes automatiques,  
**Afin d'** assurer la continuité de service et la conformité réglementaire.

#### Sous-tâches :
- ✅ **Sauvegarde quotidienne automatique** :
  - Backup complet de la base de données
  - Sauvegarde incrémentale toutes les 6 heures
  - Rétention : 30 jours en ligne, 1 an en archive
- ✅ **Journal d'activité complet** :
  - Logs de toutes les actions utilisateurs
  - Logs système et erreurs
  - Audit trail pour conformité RGPD/HDS
- ✅ **Plan de reprise d'activité (PRA)** :
  - Restauration possible en <4 heures
  - Infrastructure redondante (multi-datacenter)
  - Tests de restauration mensuels
- ✅ **Monitoring en temps réel** :
  - Alertes en cas de problème
  - Métriques de performance
  - Détection d'anomalies

#### Critères d'acceptation :
- Aucune perte de données possible (<1 heure de perte max en cas de crash)
- Les sauvegardes sont testées et vérifiées automatiquement
- Le système respecte les normes HDS (Hébergeur de Données de Santé)

---

## EPIC 7 : Recherche de Médicaments (Extension Future)

### User Story 7.1 – Chatbot IA spécialisé en pharmacologie oncologique
**En tant que** spécialiste,  
**Je veux** pouvoir interroger un assistant IA sur les médicaments, interactions et protocoles,  
**Afin d'** avoir rapidement des informations fiables pendant les RCP.

#### Sous-tâches :
- ✅ **Interface de recherche dédiée** :
  - Chatbot conversationnel
  - Requêtes en langage naturel
  - Historique des recherches
- ✅ **Base de données médicaments** (via projet de scraping) :
  - Nom commercial et DCI
  - Mécanisme d'action
  - Indications oncologiques
  - Dosages standards
  - Contre-indications
  - Interactions médicamenteuses
  - Effets secondaires et leur gestion
  - Protocoles de chimiothérapie (FOLFOX, FEC, etc.)
- ✅ **Suggestions intelligentes** :
  - Alternatives thérapeutiques
  - Ajustements posologiques selon fonction rénale/hépatique
  - Alertes sur interactions dangereuses
- ✅ **Sources traçables** :
  - Références bibliographiques
  - Date de mise à jour
  - Niveau de preuve

#### Critères d'acceptation :
- Réponse en <3 secondes
- Informations à jour (base mise à jour hebdomadairement)
- Sources fiables et vérifiées (Vidal, Thesaurus, publications scientifiques)

---

## Résumé des Nouvelles Fonctionnalités Clés

### 🤖 Agent IA Avancé
- Transcription vocale en temps réel
- Génération automatique de comptes-rendus structurés
- Création automatique de canaux patients
- Détection intelligente de dates dans conversations
- Suggestions optimisées de planification

### 💬 Communication Enrichie
- Réactions sur messages (👍 ❤️ 😊)
- Réponses en thread
- Mentions @utilisateur
- Indicateurs de lecture
- Agent IA vocal type Siri

### 🎥 Visioconférence Avancée
- Fenêtre flottante déplaçable
- Lever la main
- Réactions en temps réel
- Sous-titres automatiques
- Arrière-plan flou

### 📁 Gestion des Canaux Patients
- Création automatique par IA
- Ajout automatique des spécialistes pertinents
- Gestion manuelle complète (ajout/retrait/modification)
- Archivage automatique patients traités
- Recherche ElasticSearch full-text

### 🔐 Sécurité Renforcée
- Authentification OTP (email/SMS)
- Alertes connexions inhabituelles
- Logs d'audit complets
- Chiffrement end-to-end

### 🌍 Expérience Utilisateur
- Multilingue (FR, EN, ES, DE, IT)
- Thèmes clair/sombre/auto
- Recherche globale (Ctrl+K)
- Paramètres détaillés
- Guide interactif

### 💊 Recherche Médicaments
- Chatbot IA pharmacologie
- Base de données complète
- Interactions médicamenteuses
- Protocoles de chimiothérapie

---

## Prochaines Étapes

1. **Phase 1** : Implémentation agent IA transcription et canaux patients (Priorité 1)
2. **Phase 2** : Intégration recherche médicaments et ElasticSearch (Priorité 2)
3. **Phase 3** : Fenêtre flottante et réactions chat (Priorité 2)
4. **Phase 4** : Multilingue et OTP (Priorité 3)
5. **Phase 5** : Optimisations et tests utilisateurs (Priorité 3)

---

*Document vivant - Mis à jour régulièrement selon feedbacks utilisateurs et évolutions technologiques*
