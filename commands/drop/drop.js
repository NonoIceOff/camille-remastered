const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const roles = {
  role1: { id: "1258133421301956608", tentative: 15 },
  role2: { id: "1258133461684846742", tentative: 20 },
  role3: { id: "1258134206811475991", tentative: 25 },
};

const fishingCommand = new SlashCommandBuilder()
  .setName("drop")
  .setDescription("Lance ta ligne et attrape quelque chose !")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Le type de drop")
      .setRequired(true)
      .addChoices(
        { name: "Poissons & Trésors", value: "fish" },
        { name: "Fruits & Légumes", value: "fruit_vegetable" },
        { name: "Minecraft", value: "minecraft" },
        { name: "Pays", value: "country" }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName("nombre")
      .setDescription("Nombre de fois à drop")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)
  );

const rarityWeights = {
  commun: 5,
  "peu commun": 3,
  rare: 2,
  "très rare": 1,
};

const rarityMessages = {
  commun: "*Le drop attrapé est commun.*",
  "peu commun": "**Tu as eu de la chance, c'est peu commun !**",
  rare: "***C'est un rare spécimen !***",
  "très rare": "***Incroyable ! Un drop très rare !***",
};

function getWeight(item) {
  return rarityWeights[item.rarity] || 1;
}

function getMessageStyle(item) {
  return rarityMessages[item.rarity] || "";
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function getUserDailyData(userId) {
  const today = getTodayDate();
  const directoryPath = "daily_usage";
  const filePath = path.resolve(`${directoryPath}/${today}.json`);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  let dailyData = {};

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      dailyData = JSON.parse(fileContent);
    } catch (error) {
      console.error(
        "Erreur lors de la lecture des données quotidiennes:",
        error
      );
    }
  }

  if (!dailyData[userId]) {
    dailyData[userId] = { attempts: 0 };
  }

  return { dailyData, filePath };
}

function saveUserDailyData(filePath, dailyData) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(dailyData, null, 4), "utf-8");
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des données quotidiennes:",
      error
    );
  }
}

async function loadInventory(userId) {
  var inventory;

  try {
    inventory = await axios.get(
      `https://zeldaapi.vercel.app/api/user/${userId}/inventory`
    );
  } catch (error) {
    console.error(
      `Erreur lors du chargement de l'inventaire du joueur ${userId}:`,
      error
    );
  }

  return { items: inventory.data };
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

// Fonction pour générer une barre de progression
function generateProgressBar(current, total, length = 20) {
  const progress = Math.round((current / total) * length);
  const emptyProgress = length - progress;

  const progressText = "█".repeat(progress);
  const emptyText = "░".repeat(emptyProgress);

  return `${progressText}${emptyText} ${current}/${total}`;
}

module.exports = {
  data: fishingCommand,
  async execute(interaction) {
    try {
      // Différer la réponse de l'interaction pour éviter qu'elle n'expire
      await interaction.deferReply();

      const userId = interaction.user.id;
      const type = interaction.options.getString("type");
      const numberOfAttempts = interaction.options.getInteger("nombre") || 1;

      const { dailyData, filePath } = getUserDailyData(userId);

      let maxAttempts = 10; // Nombre de tentatives de base
      for (const roleKey in roles) {
        const role = roles[roleKey];
        if (interaction.member.roles.cache.has(role.id)) {
          maxAttempts = role.tentative;
          break;
        }
      }

      if (!dailyData[userId]) {
        dailyData[userId] = { attempts: 0 };
      }

      if (dailyData[userId].attempts + numberOfAttempts > maxAttempts) {
        await interaction.editReply(
          `Vous avez atteint la limite de ${maxAttempts} tentatives de drop pour aujourd'hui.`
        );
        return;
      }

      const inventory = await loadInventory(userId);
      const caughtItems = {};

      const response = await axios.get(
        `https://zeldaapi.vercel.app/api/items?type=${type}`
      );
      let listType = response.data;

      if (type === "fish") {
        const response2 = await axios.get(
          `https://zeldaapi.vercel.app/api/items?type=treasure`
        );
        listType = [...response.data, ...response2.data];
      }

      for (let attempt = 0; attempt < numberOfAttempts; attempt++) {
        const progressBar = generateProgressBar(attempt + 1, numberOfAttempts);
        await interaction.editReply(`${progressBar}`);
        const newItem = getRandomItem(listType);

        const existingItemIndex = inventory.items.findIndex(
          (item) => item.name === newItem.name
        );

        // Ajouter l'item à l'inventaire
        await axios.post(`https://zeldaapi.vercel.app/api/add_item/${userId}`, {
          itemId: newItem.id,
          quantity: 1,
        });

        const isNewItem = existingItemIndex === -1;

        if (!caughtItems[newItem.name]) {
          caughtItems[newItem.name] = {
            item: newItem,
            count: 0,
            rarity: newItem.rarity,
            isNew: isNewItem,
          };
        }

        caughtItems[newItem.name].count++;
      }

      const embedBuilder = new EmbedBuilder().setTitle(
        `Résultats de la pêche (${
          numberOfAttempts > 1
            ? `${numberOfAttempts} tentatives`
            : "1 tentative"
        })`
      );
      embedBuilder.setColor("#FFD700");

      Object.values(caughtItems).forEach(({ item, count, rarity, isNew }) => {
        const firstLetter = rarity.charAt(0);
        const firstLetterCap = firstLetter.toUpperCase();
        const remainingLetters = rarity.slice(1);
        const capitalizedWord = firstLetterCap + remainingLetters;

        embedBuilder.addFields({
          name: `${count > 1 ? `${count}x ` : ""}${item.emoji} **${
            item.name
          }** `,
          value: `*${capitalizedWord}* ${isNew ? " **Nouveau !**" : " "}`,
          inline: true,
        });
      });

      embedBuilder.setFooter({
        text: "Commun 45.45% | Peu commun 27.27% | Rare 18.18% | Très rare 9.09%",
      });

      dailyData[userId].attempts += numberOfAttempts;
      saveUserDailyData(filePath, dailyData);

      await interaction.editReply({ content: " ", embeds: [embedBuilder] });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la commande de pêche:",
        error
      );
      await interaction.editReply({
        content:
          "Une erreur est survenue lors de l'exécution de la commande de pêche. Veuillez réessayer plus tard.",
        ephemeral: true,
      });
    }
  },
};
