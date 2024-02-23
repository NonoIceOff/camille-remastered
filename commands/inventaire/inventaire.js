const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const inventoryFile = 'inventory.json';

function readInventory() {
  try {
    const data = fs.readFileSync(inventoryFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'inventaire :', error);
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventaire')
    .setDescription('Affiche votre inventaire.'),
  async execute(interaction) {
    const user = interaction.user;
    const inventoryData = readInventory();

    // Vérifiez si l'utilisateur a un inventaire
    if (!inventoryData.inventory || !inventoryData.inventory[user.id]) {
      return await interaction.reply('Vous n\'avez pas encore d\'inventaire.');
    }

    const userInventory = inventoryData.inventory[user.id];

    // Créez un Embed pour afficher l'inventaire en violet
    const inventoryEmbed = {
      title: `Inventaire de ${user.username}`,
      color: 0x800080, // Violet
      fields: [],
    };

    for (const type in userInventory) {
      let formattedItems = '';

      for (const itemName in userInventory[type]) {
        const itemQuantity = userInventory[type][itemName];
        formattedItems += `**${itemName} x${itemQuantity}**\n`;
      }

      inventoryEmbed.fields.push({
        name: `**${type}**`, // Met le type en gras
        value: formattedItems,
        inline: true,
      });
    }

    // Envoyez l'Embed
    await interaction.reply({ embeds: [inventoryEmbed] });
  },
};
