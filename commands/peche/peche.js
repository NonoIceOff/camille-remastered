const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const { fishList, treasureList } = require('./items');

const fishingCommand = new SlashCommandBuilder()
  .setName('peche')
  .setDescription('Lance ta ligne et attrape quelque chose !');

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

module.exports = {
  data: fishingCommand,
  async execute(interaction) {


    const userId = interaction.user.id;

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

    fs.writeFileSync(`inventory/user_${userId}.json`, JSON.stringify(inventory, null, 4), 'utf-8');

    const messageStyle = getMessageStyle(newItem);
    await interaction.reply(`Tu as attrapé : ${newItem.emoji} (${newItem.name}).\n${messageStyle}`);
  },
};
