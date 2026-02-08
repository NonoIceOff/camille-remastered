# Image de base Node.js optimisée pour ARM64
FROM node:20-slim

# Installer les dépendances système si nécessaire (Puppeteer, etc.)
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libnss3 \
    libxss1 \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm config set legacy-peer-deps true && \
    npm install --production --no-optional

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p logs daily_claim_usage MONTHLY_USAGE

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Commande de démarrage
CMD ["node", "main.js"]