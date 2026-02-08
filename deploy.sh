#!/bin/bash

# Script de déploiement pour Raspberry Pi 5
# Compatible ARM64

set -e

echo "🤖 Déploiement de Camille Bot sur Raspberry Pi 5"
echo "================================================"
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installé avec succès"
    echo "⚠️  Veuillez vous déconnecter et vous reconnecter pour appliquer les changements"
    exit 0
fi

# Vérifier si Docker Compose est installé
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    echo "📦 Installation de Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose installé avec succès"
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé"
    if [ -f .env.example ]; then
        echo "📝 Création du fichier .env depuis .env.example..."
        cp .env.example .env
        echo "✅ Fichier .env créé"
        echo "⚠️  Veuillez éditer le fichier .env avec vos vraies valeurs :"
        echo "   nano .env"
        echo ""
        echo "Vous devez remplir au minimum :"
        echo "  - DISCORD_TOKEN"
        echo "  - GUILD_ID"
        echo "  - CLIENT_ID"
        exit 1
    else
        echo "❌ Fichier .env.example non trouvé"
        exit 1
    fi
fi

# Vérifier les variables obligatoires
echo "🔍 Vérification de la configuration..."
source .env

if [ -z "$DISCORD_TOKEN" ] || [ "$DISCORD_TOKEN" = "your_discord_token_here" ]; then
    echo "❌ DISCORD_TOKEN non configuré dans .env"
    exit 1
fi

if [ -z "$GUILD_ID" ] || [ "$GUILD_ID" = "your_guild_id_here" ]; then
    echo "❌ GUILD_ID non configuré dans .env"
    exit 1
fi

if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "your_client_id_here" ]; then
    echo "❌ CLIENT_ID non configuré dans .env"
    exit 1
fi

echo "✅ Configuration valide"
echo ""

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p logs daily_claim_usage MONTHLY_USAGE
touch lastVideoId.txt lastVideoId2.txt
echo "✅ Répertoires créés"
echo ""

# Construire et lancer le conteneur
echo "🏗️  Construction de l'image Docker..."
docker compose build

echo ""
echo "🚀 Lancement du bot..."
docker compose up -d

echo ""
echo "✅ Bot démarré avec succès !"
echo ""
echo "📊 Commandes utiles :"
echo "  - Voir les logs :      docker compose logs -f"
echo "  - Arrêter le bot :     docker compose down"
echo "  - Redémarrer le bot :  docker compose restart"
echo "  - État du bot :        docker compose ps"
echo ""
echo "📖 Consultez DOCKER.md pour plus d'informations"

