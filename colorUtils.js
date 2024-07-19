const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chemin du répertoire des statistiques
const statsDir = path.join(__dirname, 'stats');

// Fonction pour attribuer une couleur vive unique à un utilisateur en fonction de son ID
function getColorFromId(userId) {
    // Utiliser SHA-256 pour créer un hachage à partir de l'ID de l'utilisateur
    const hash = crypto.createHash('sha256').update(userId).digest('hex');

    // Extraire les composants de couleur du hachage (par exemple, les 6 premiers caractères)
    const colorHash = hash.substring(0, 6);

    // Convertir le hachage en valeurs RGB
    const r = parseInt(colorHash.substring(0, 2), 16);
    const g = parseInt(colorHash.substring(2, 4), 16);
    const b = parseInt(colorHash.substring(4, 6), 16);

    // Retourner la couleur RGB sous forme de chaîne
    const rgbColor = `rgb(${r}, ${g}, ${b})`;

    // Charger les statistiques de l'utilisateur
    const userStats = loadUserStats(userId);

    // Vérifier si l'utilisateur a déjà une couleur définie
    if (userStats.color) {
        return userStats.color; // Retourner la couleur définie par l'utilisateur
    } else {
        // Si aucune couleur définie, enregistrer la couleur générée dans les statistiques de l'utilisateur
        userStats.color = rgbColor;
        saveUserStats(userId, userStats); // Sauvegarder les statistiques mises à jour

        return rgbColor; // Retourner la nouvelle couleur générée
    }
}

// Fonction pour charger les statistiques d'un utilisateur depuis un fichier JSON
function loadUserStats(userId) {
    const userStatsFilePath = path.join(statsDir, `user_${userId}.json`);

    try {
        const statsFileContent = fs.readFileSync(userStatsFilePath, 'utf-8');
        return JSON.parse(statsFileContent);
    } catch (error) {
        // En cas d'erreur (fichier non trouvé ou erreur de lecture), retourner un objet vide
        console.error(`Erreur lors du chargement des statistiques de l'utilisateur ${userId}:`, error);
        return {};
    }
}

// Fonction pour sauvegarder les statistiques d'un utilisateur dans un fichier JSON
function saveUserStats(userId, stats) {
    const userStatsFilePath = path.join(statsDir, `user_${userId}.json`);

    try {
        const jsonData = JSON.stringify(stats, null, 2);
        fs.writeFileSync(userStatsFilePath, jsonData, 'utf-8');
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde des statistiques de l'utilisateur ${userId}:`, error);
    }
}


// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = { getColorFromId };
