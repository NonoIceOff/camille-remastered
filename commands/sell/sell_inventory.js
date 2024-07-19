const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  getUserInfos,
  modifyUser,
  changeUserInfos,
} = require("../../utils/user.js");

const roles = {
  role1: { id: "1258133421301956608", multiplier: 0.6 },
  role2: { id: "1258133461684846742", multiplier: 0.7 },
  role3: { id: "1258134206811475991", multiplier: 0.8 },
};

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }
}

function ensureFileExists(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(defaultContent, null, 4),
      "utf-8"
    );
  }
}

module.exports = {
  async execute(interaction) {
    const userId = interaction.user.id;
    const rarityToSell = interaction.options.getString("rarity");

    const inventoryDir = "inventory";
    const statsDir = "stats";
    const userInventoryFilePath = `${inventoryDir}/user_${userId}.json`;
    const userStatsFilePath = `${statsDir}/user_${userId}.json`;

    ensureDirectoryExists(inventoryDir);
    ensureDirectoryExists(statsDir);

    ensureFileExists(userInventoryFilePath, { items: [] });
    ensureFileExists(userStatsFilePath, { coins: 0 });

    let inventory;
    try {
      const inv = await axios.get(
        `https://zeldaapi.vercel.app/api/user/${interaction.user.id}/inventory`
      );
      inventory = { items: inv.data };
    } catch (error) {
      console.error(`Error loading user inventory for user ${userId}:`, error);
      return interaction.reply({
        content:
          "Une erreur est survenue lors du chargement de votre inventaire.",
        ephemeral: true,
      });
    }

    if (!inventory.items || inventory.items.length === 0) {
      await interaction.reply("Votre inventaire est vide.");
      return;
    }

    const shopItems = await axios
      .get(`https://zeldaapi.vercel.app/api/items`)
      .then((response) => response.data);
    let itemsToSell;

    if (rarityToSell) {
      itemsToSell = inventory.items.filter((item) => {
        const shopItem = shopItems.find(
          (shopItem) => shopItem.name === item.name
        );
        return shopItem && shopItem.rarity === rarityToSell;
      });

      if (itemsToSell.length === 0) {
        await interaction.reply(
          `Aucun article de rareté "${rarityToSell}" trouvé dans votre inventaire.`
        );
        return;
      }
    } else {
      itemsToSell = inventory.items;
    }

    let multiplier = 0.5; // Valeur de base
    for (const roleKey in roles) {
      const role = roles[roleKey];
      if (interaction.member.roles.cache.has(role.id)) {
        multiplier = role.multiplier;
        break;
      }
    }

    let totalValue = 0;
    itemsToSell.forEach((item) => {
      const shopItem = shopItems.find(
        (shopItem) => shopItem.name === item.name
      );
      totalValue += shopItem.price * multiplier * item.quantity;
    });

    await changeUserInfos(interaction.user.id, totalValue, "", "", 0, 0, 0);

    await interaction.reply(
      `Vous avez vendu ${
        rarityToSell
          ? `tous les articles de rareté "${rarityToSell}"`
          : "tous vos articles"
      } pour un total de ${totalValue} <:gold:1261787387395047424>. (${
        multiplier * 100
      }% du prix de vos items)`
    );
  },
};
