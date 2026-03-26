# 🐳 Olga Designer & Admin & Backend — Lancement avec Docker

## 🎯 Objectif

Ce guide explique comment démarrer l’ensemble des services de l’application (**Backend, Frontends, Base de données**) à l’aide de **Docker Compose**.

---

## ✅ Prérequis

* **Docker** installé et en cours d’exécution
* **Docker Compose v2** (`docker compose`)
  *(ou `docker-compose` si version plus ancienne)*

---

## 📁 Structure du projet

* `docker-compose.yml`
* `Dockerfile.admin`
* `Dockerfile.designer`
* Dossier `config/` (fichiers montés dans les conteneurs)

---

## ⚙️ Configuration des fichiers

> ⚠️ Par défaut, les fichiers doivent être placés dans `./config`.
> Si vous les placez ailleurs, adaptez les chemins dans `docker-compose.yml` ou les variables d’environnement.

---

### 1. config.json

Contient la configuration Firebase et l’URL de l’API pour le développement local.

#### 🔹 Récupérer firebaseConfig

1. Se connecter à **Firebase**
2. Aller dans **Paramètres → Paramètres généraux**
3. Ajouter une application si nécessaire
4. Copier le contenu de la variable `firebaseConfig`

#### 🔹 Exemple

```json
{
  "EDHA": {
    "label": "Développement Local",
    "firebaseOptions": {
      // coller ici les données firebaseConfig
    },
    "apiBaseUrl": "http://localhost:9091/"
  }
}
```

---

### 2. apiKey.json

Contient la clé de service Firebase (backend uniquement).

#### 🔹 Structure attendue

```json
{
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": ""
}
```

#### 🔹 Génération

1. Firebase → **Paramètres → Comptes de service**
2. Cliquer sur **Générer une clé privée**
3. Copier le JSON téléchargé dans `apiKey.json`

---

### 3. .env.mysql

Variables d’environnement du service MySQL.

```env
MYSQL_ROOT_PASSWORD=<ROOT_PASSWORD>
MYSQL_USER=<USERNAME>
MYSQL_PASSWORD=<USER_PASSWORD>
MYSQL_DATABASE=olga
```

| Variable            | Description              |
| ------------------- | ------------------------ |
| MYSQL_ROOT_PASSWORD | Mot de passe root MySQL  |
| MYSQL_DATABASE      | Nom de la base créée     |
| MYSQL_USER          | Utilisateur applicatif   |
| MYSQL_PASSWORD      | Mot de passe utilisateur |

---

### 4. .env.back

Variables d’environnement du Backend.

```env
ADDRESS=0.0.0.0
PORT=9091
MYSQL_URL=jdbc:mysql://mysql:3306/olga
MYSQL_USERNAME=<USERNAME>
MYSQL_PASSWORD=<USER_PASSWORD>
FIREBASE_KEY_PATH=/app/config/apiKey.json
```

| Variable          | Description                               |
| ----------------- | ----------------------------------------- |
| ADDRESS           | Adresse d’écoute du serveur               |
| PORT              | Port du backend                           |
| MYSQL_URL         | URL JDBC MySQL                            |
| MYSQL_USERNAME    | Utilisateur MySQL                         |
| MYSQL_PASSWORD    | Mot de passe MySQL                        |
| FIREBASE_KEY_PATH | Chemin vers apiKey.json dans le conteneur |

---

### 5. .env.front

Variables d’environnement des frontends.

```env
VITE_BACKEND_URL=http://localhost:9091
```

| Variable         | Description           |
| ---------------- | --------------------- |
| VITE_BACKEND_URL | URL publique de l’API |

---

## 🌐 Services exposés

| Service     | URL / Port                                     |
| ----------- | ---------------------------------------------- |
| MySQL       | 3306                                           |
| phpMyAdmin  | [http://localhost:81](http://localhost:81)     |
| Backend API | [http://localhost:9091](http://localhost:9091) |
| Designer    | [http://localhost:8080](http://localhost:8080) |
| Admin       | [http://localhost:8081](http://localhost:8081) |

---

## 🚀 Démarrer les services

```bash
docker compose up -d --build
```

* Construit les images si nécessaire
* Démarre tous les services en arrière-plan

---

## 🛑 Arrêter les services

```bash
docker compose down
```

### Supprimer aussi les volumes (⚠ supprime la base)

```bash
docker compose down -v
```

---

## 🔄 Rebuild d’un service spécifique

Exemple pour le service `designer` :

```bash
docker compose up -d --build designer
```

---

## 📋 Logs & Debug

### Voir tous les logs

```bash
docker compose logs -f
```

### Logs d’un service spécifique

```bash
docker compose logs -f backend
```

### Ouvrir un shell dans le backend

```bash
docker compose exec backend sh
```

---

## 📌 Fichiers importants

| Fichier            | Rôle                    |
| ------------------ | ----------------------- |
| config/config.json | Configuration frontend  |
| config/apiKey.json | Clé Firebase backend    |
| .env.mysql         | Configuration MySQL     |
| .env.back          | Configuration backend   |
| .env.front         | Configuration frontends |

⚠ Vérifiez ces fichiers avant de lancer l’application
