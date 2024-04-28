const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventaire-peche')
  .setDescription('Affiche ton inventaire de pêche.');

module.exports = {
  data: inventoryCommand,
  async execute(interaction) {
    const userId = interaction.user.id;

    let inventory = {};
    try {
      const inventoryFileContent = fs.readFileSync(`inventory/user_${userId}.json`, 'utf-8');
      inventory = JSON.parse(inventoryFileContent);
    } catch (error) {
      console.error(`Erreur lors du chargement de l'inventaire de pêche du joueur ${userId}:`, error);
    }

    if (!inventory.items || inventory.items.length === 0) {
      await interaction.reply("Ton inventaire de pêche est vide !");
      return;
    }

    let inventoryMessage = "Voici ton inventaire de pêche :\n";
    inventory.items.forEach((item, index) => {
      inventoryMessage += `${index + 1}. ${item.name} ${item.emoji} (x${item.quantity})\n`;
    });

    await interaction.reply(inventoryMessage);
  },
};
