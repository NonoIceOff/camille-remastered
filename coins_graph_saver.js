const croned = require('node-cron');
const fs = require('fs');
const path = require('path');

const statsDirectory = path.join(__dirname, 'stats');
const logsDirectory = path.join(__dirname, 'logs');

// Créez le répertoire des logs s'il n'existe pas
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

const scheduleDailyStatsLogging = () => {
  // Tâche planifiée pour s'exécuter tous les jours à 23h59
  croned.schedule('00 00 * * *', () => {
    console.log('Tâche planifiée exécutée à 23h59 pour enregistrer les coins.');

    let userStatsList = [];

    // Lire tous les fichiers de stats
    fs.readdirSync(statsDirectory).forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(statsDirectory, file);
        try {
          const userStatsFileContent = fs.readFileSync(filePath, 'utf-8');
          const userStats = JSON.parse(userStatsFileContent);
          const userId = path.basename(file, '.json').split('_')[1];
          userStatsList.push({ userId, coins: userStats.coins || 0 });
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier ${filePath} :`, error);
        }
      }
    });

    // Enregistrer les stats dans un fichier log
    const logFilePath = path.join(logsDirectory, `log_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(logFilePath, JSON.stringify(userStatsList, null, 4), 'utf-8');
    console.log(`Statistiques enregistrées dans ${logFilePath}`);
  });
};

module.exports = {
  scheduleDailyStatsLogging
};
