const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

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

    if (!inventory.items || inventory.items.length === 0) {
      await interaction.reply("Votre inventaire est vide.");
      return;
    }

    const shopItems = await axios
      .get(`https://zeldaapi.vercel.app/api/items`)
      .then((response) => response.data);
    let itemsToSell;

    const subcommand = interaction.options.getSubcommand();
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

    let raritys = ["commun", "peu commun", "rare", "très rare"];
    let texte = `**Simulation de vente par rareté *(${
      multiplier * 100
    }% du prix total des items)*:**`;
    for (let index = 0; index < 4; index++) {
      let totalValue = 0;
      itemsToSell.forEach((item) => {
        const shopItem = shopItems.find(
          (shopItem) => shopItem.name === item.name
        );
        if (shopItem != undefined) {
          if (shopItem.rarity == raritys[index]) {
            totalValue += shopItem.price * multiplier * item.quantity;
          }
        }
      });
      texte += `\n${raritys[index]} : *${totalValue}* <:gold:1261787387395047424>`;
    }

    await interaction.reply(texte);
  },
};
