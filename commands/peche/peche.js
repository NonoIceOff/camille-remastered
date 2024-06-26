const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const { fishList, treasureList } = require('./items');
const path = require('path');

const fishingCommand = new SlashCommandBuilder()
  .setName('peche')
  .setDescription('Lance ta ligne et attrape quelque chose !')
  .addIntegerOption(option => 
    option.setName('nombre')
      .setDescription('Nombre de fois à pêcher')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(10) // Limit the max value to 10
  );

function getWeight(item) {
  switch (item.rarity) {
    case 'commun':
      return 5;
    case 'peu commun':
      return 3;
    case 'rare':
      return 2;
    case 'très rare':
      return 1;
    default:
      return 1;
  }
}

function getMessageStyle(item) {
  switch (item.rarity) {
    case 'commun':
      return '*Le poisson attrapé est commun.*';
    case 'peu commun':
      return '**Tu as eu de la chance, c\'est peu commun !**';
    case 'rare':
      return '***C\'est un rare spécimen !***';
    case 'très rare':
      return '***Incroyable ! Un trésor très rare !***';
    default:
      return '';
  }
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function getUserDailyData(userId) {
  const today = getTodayDate();
  const directoryPath = 'daily_usage';
  const filePath = path.resolve(`${directoryPath}/${today}.json`);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  let dailyData = {};

  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      dailyData = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des données quotidiennes:', error);
  }

  if (!dailyData[userId]) {
    dailyData[userId] = { attempts: 0 };
  }

  return { dailyData, filePath };
}

function saveUserDailyData(filePath, dailyData) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(dailyData, null, 4), 'utf-8');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données quotidiennes:', error);
  }
}

module.exports = {
  data: fishingCommand,
  async execute(interaction) {
    const userId = interaction.user.id;
    const numberOfAttempts = interaction.options.getInteger('nombre') || 1;

    const { dailyData, filePath } = getUserDailyData(userId);

    if (dailyData[userId].attempts + numberOfAttempts > 10) {
      await interaction.reply(`Vous avez atteint la limite de 10 tentatives de pêche pour aujourd'hui.`);
      return;
    }

    if (!fs.existsSync('inventory')) {
      fs.mkdirSync('inventory');
    }

    let inventory = {};
    try {
      const inventoryFileContent = fs.readFileSync(`inventory/user_${userId}.json`, 'utf-8');
      inventory = JSON.parse(inventoryFileContent);
    } catch (error) {
      console.error(`Erreur lors du chargement de l'inventaire du joueur ${userId}:`, error);
    }

    if (!Array.isArray(inventory.items)) {
      inventory.items = [];
    }

    const results = [];
    
    for (let attempt = 0; attempt < numberOfAttempts; attempt++) {
      let newItem;
      if (Math.random() < 0.5) {
        const totalFishWeight = fishList.reduce((acc, fish) => acc + getWeight(fish), 0);
        const randomWeight = Math.random() * totalFishWeight;
        let cumulativeWeight = 0;
        for (const fish of fishList) {
          cumulativeWeight += getWeight(fish);
          if (randomWeight <= cumulativeWeight) {
            newItem = fish;
            break;
          }
        }
      } else {
        const totalTreasureWeight = treasureList.reduce((acc, treasure) => acc + getWeight(treasure), 0);
        const randomWeight = Math.random() * totalTreasureWeight;
        let cumulativeWeight = 0;
        for (const treasure of treasureList) {
          cumulativeWeight += getWeight(treasure);
          if (randomWeight <= cumulativeWeight) {
            newItem = treasure;
            break;
          }
        }
      }

      const existingItemIndex = inventory.items.findIndex(item => item.name === newItem.name);

      if (existingItemIndex !== -1) {
        inventory.items[existingItemIndex].quantity++;
      } else {
        inventory.items.push({ ...newItem, quantity: 1 });
      }

      results.push(`Tu as attrapé : ${newItem.emoji} (${newItem.name}).\n${getMessageStyle(newItem)}`);
    }

    fs.writeFileSync(`inventory/user_${userId}.json`, JSON.stringify(inventory, null, 4), 'utf-8');

    dailyData[userId].attempts += numberOfAttempts;
    saveUserDailyData(filePath, dailyData);

    await interaction.reply(results.join('\n\n'));
  },
};
