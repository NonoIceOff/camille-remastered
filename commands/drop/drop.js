const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { fishList, treasureList, fruitVegList, minecraft } = require('./items');
const axios = require("axios");

const roles = {
  'role1': { id: '1258133421301956608', tentative: 15 },
  'role2': { id: '1258133461684846742', tentative: 20 },
  'role3': { id: '1258134206811475991', tentative: 25 },
};

const fishingCommand = new SlashCommandBuilder()
  .setName('drop')
  .setDescription('Lance ta ligne et attrape quelque chose !')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Le type de drop')
      .setRequired(true)
      .addChoices(
        { name: 'Poissons & Trésors', value: 'fish' },
        { name: 'Fruits & Légumes', value: 'fruit_vegetable' },
        { name: 'Minecraft', value: 'minecraft' }
      )
  )
  .addIntegerOption(option =>
    option
      .setName('nombre')
      .setDescription('Nombre de fois à drop')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)
  );

const rarityWeights = {
  'commun': 5,
  'peu commun': 3,
  'rare': 2,
  'très rare': 1,
};

const rarityMessages = {
  'commun': '*Le drop attrapé est commun.*',
  'peu commun': '**Tu as eu de la chance, c\'est peu commun !**',
  'rare': '***C\'est un rare spécimen !***',
  'très rare': '***Incroyable ! Un drop très rare !***',
};

function getWeight(item) {
  return rarityWeights[item.rarity] || 1;
}

function getMessageStyle(item) {
  return rarityMessages[item.rarity] || '';
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

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      dailyData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Erreur lors de la lecture des données quotidiennes:', error);
    }
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

function loadInventory(userId) {
  const userInventoryFilePath = `inventory/user_${userId}.json`;

  if (!fs.existsSync('inventory')) {
    fs.mkdirSync('inventory');
  }

  if (fs.existsSync(userInventoryFilePath)) {
    try {
      const inventoryFileContent = fs.readFileSync(userInventoryFilePath, 'utf-8');
      return JSON.parse(inventoryFileContent);
    } catch (error) {
      console.error(`Erreur lors du chargement de l'inventaire du joueur ${userId}:`, error);
    }
  }

  return { items: [] };
}

function saveInventory(userId, inventory) {
  const userInventoryFilePath = `inventory/user_${userId}.json`;
  try {
    fs.writeFileSync(userInventoryFilePath, JSON.stringify(inventory, null, 4), 'utf-8');
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de l'inventaire du joueur ${userId}:`, error);
  }
}

function getRandomItem(list) {
  const totalWeight = list.reduce((acc, item) => acc + getWeight(item), 0);
  const randomWeight = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const item of list) {
    cumulativeWeight += getWeight(item);
    if (randomWeight <= cumulativeWeight) {
      return item;
    }
  }
}

module.exports = {
  data: fishingCommand,
  async execute(interaction) {
    
    const userId = interaction.user.id;
    const type = interaction.options.getString('type');
    const numberOfAttempts = interaction.options.getInteger('nombre') || 1;

    const { dailyData, filePath } = getUserDailyData(userId);

    let maxAttempts = 10; // Nombre de tentatives de base
    for (const roleKey in roles) {
      const role = roles[roleKey];
      if (interaction.member.roles.cache.has(role.id)) {
        maxAttempts = role.tentative;
        break;
      }
    }

    if (dailyData[userId].attempts + numberOfAttempts > maxAttempts) {
      await interaction.reply(`Vous avez atteint la limite de ${maxAttempts} tentatives de drop pour aujourd'hui.`);
      return;
    }

    const inventory = loadInventory(userId);
    const caughtItems = {};

    //const listType = type === 'fish' ? [...fishList, ...treasureList] : type === 'minecraft' ? minecraft : fruitVegList;
    
    const response =  await axios.get(`https://zeldaapi.vercel.app/api/items?type=${type}`);
    var listType = response.data

    if (type == "fish") {
      const response2 =  await axios.get(`https://zeldaapi.vercel.app/api/items?type=treasure`);
      listType = [...response.data, ...response2.data]
    }


    for (let attempt = 0; attempt < numberOfAttempts; attempt++) {
      const newItem = getRandomItem(listType);

      const existingItemIndex = inventory.items.findIndex(item => item.name === newItem.name);

      if (existingItemIndex !== -1) {
        inventory.items[existingItemIndex].quantity++;
      } else {
        inventory.items.push({ ...newItem, quantity: 1 });
      }

      if (!caughtItems[newItem.name]) {
        caughtItems[newItem.name] = { item: newItem, count: 0 };
      }

      caughtItems[newItem.name].count++;
    }

    const embedBuilder = new EmbedBuilder().setTitle(
      `Résultats de la pêche (${numberOfAttempts > 1 ? `${numberOfAttempts} tentatives` : '1 tentative'})`
    );
    embedBuilder.setColor("#FFD700")

    Object.values(caughtItems).forEach(({ item, count }) => {
      embedBuilder.addFields({
        name: `${count > 1 ? `${count}x ` : ''}${item.emoji} ${item.name}`,
        value: getMessageStyle(item),
        inline: true,
      });
    });

    saveInventory(userId, inventory);

    dailyData[userId].attempts += numberOfAttempts;
    saveUserDailyData(filePath, dailyData);

    await interaction.reply({ embeds: [embedBuilder] });
  },
};
