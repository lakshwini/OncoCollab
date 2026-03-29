# ============================================================
# Dockerfile — Backend (NestJS / Node 20)
# ============================================================
# Stage 1 : build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer TOUTES les dépendances (y compris dev pour le build NestJS)
RUN npm ci

# Copier le code source
COPY . .

# Compiler TypeScript → dist/
RUN npm run build

# ============================================================
# Stage 2 : image de production (légère)
FROM node:20-alpine AS production

WORKDIR /app

# Variables d'environnement de production
ENV NODE_ENV=production

# Copier uniquement les dépendances de production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copier le build compilé
COPY --from=builder /app/dist ./dist

# Copier les fichiers de config NestJS si nécessaires
COPY nest-cli.json tsconfig.json ./

EXPOSE 3002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3002/ || exit 1

CMD ["node", "dist/main"]
