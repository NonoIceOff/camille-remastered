# Utiliser une image Node.js officielle compatible ARM64 (version plus récente)
FROM node:20-bookworm-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances en plusieurs étapes pour éviter le bug runc
RUN apt-get update

# Étape 1 : Outils de base
RUN apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates

# Étape 2 : Chromium et dépendances
RUN apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    fonts-liberation

# Étape 3 : Bibliothèques système
RUN apt-get install -y --no-install-recommends \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1

# Étape 4 : GTK et X11
RUN apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils

# Étape 5 : Outils de build pour canvas
RUN apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Étape 6 : FFmpeg et nettoyage
RUN apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copier les fichiers package.json et package-lock.json (si présent)
COPY package*.json ./

# Installer les dépendances Node.js avec legacy peer deps
RUN npm config set legacy-peer-deps true && \
    npm install --production --no-optional

# Copier le reste des fichiers de l'application
COPY . .

# Créer les répertoires nécessaires s'ils n'existent pas
RUN mkdir -p logs daily_claim_usage MONTHLY_USAGE

# Définir les variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Exposer le port si nécessaire (optionnel pour un bot Discord)
# EXPOSE 3000

# Commande de démarrage
CMD ["node", "main.js"]

