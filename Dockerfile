# ============================================================
# Dockerfile — Frontend (React / Vite)
# ============================================================
# Stage 1 : build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Injecter les variables d'environnement Vite au moment du build
# (Vite intègre les VITE_* dans le bundle statique, pas au runtime)
COPY .env.frontend .env

# Construire l'application Vite (output → ./build)
RUN npm run build

# ============================================================
# Stage 2 : serve avec nginx
FROM nginx:1.25-alpine

# Config nginx personnalisée
COPY docker/nginx.frontend.conf /etc/nginx/conf.d/default.conf

# Copier le build depuis le stage précédent
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
