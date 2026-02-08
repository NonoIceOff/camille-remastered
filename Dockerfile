# Image de base Node.js
FROM node:20-slim

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install --production

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p logs daily_claim_usage MONTHLY_USAGE

# Commande de démarrage
CMD ["node", "main.js"]

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

