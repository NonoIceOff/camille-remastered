const fs = require('fs');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, EmbedBuilder } = require('discord.js');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventaire')
  .setDescription('Affiche ton inventaire.');

const itemsPerPage = 10; // Customize the number of items per page

const rarityOrder = ['commun', 'peu commun', 'rare', 'très rare'];

module.exports = {
  data: inventoryCommand,
  async execute(interaction) {
    const userId = interaction.user.id;

    let inventory = {};
    try {
      const inventoryFileContent = fs.readFileSync(`inventory/user_${userId}.json`, 'utf-8');
      inventory = JSON.parse(inventoryFileContent);
    } catch (error) {
      console.error(`Erreur lors du chargement de l'inventaire  du joueur ${userId}:`, error);
      await interaction.reply("Une erreur est survenue lors de la récupération de votre inventaire.");
      return;
    }

    if (!inventory.items || inventory.items.length === 0) {
      await interaction.reply("Ton inventaire de pêche est vide !");
      return;
    }

    // Sort items by rarity
    inventory.items.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

    const totalPages = Math.ceil(inventory.items.length / itemsPerPage);
    let currentPage = 1;

    const generateEmbedPage = (startIndex) => {
      const embed = new EmbedBuilder()
        .setTitle("Ton inventaire")

      const pageItems = inventory.items.slice(startIndex, startIndex + itemsPerPage);

      pageItems.forEach((item, index) => {
        embed.addFields({ name: `${startIndex + index + 1}. ${item.name} ${item.emoji}`, value: `(x${item.quantity}) ${item.rarity}`, inline: true });
      });

      embed.setFooter({ text: `Page ${currentPage} sur ${totalPages}` });

      return embed;
    };

    const generateButtons = () => new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous_page')
          .setLabel('Précédent')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Suivant')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages)
      );

    const initialMessage = await interaction.reply({ embeds: [generateEmbedPage(0)], components: [generateButtons()] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (buttonInteraction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id,
      time: 60000, // Customize button timeout (optional)
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'previous_page' && currentPage > 1) {
        currentPage--;
      } else if (buttonInteraction.customId === 'next_page' && currentPage < totalPages) {
        currentPage++;
      }

      await buttonInteraction.update({ embeds: [generateEmbedPage((currentPage - 1) * itemsPerPage)], components: [generateButtons()] });
    });

    collector.on('end', async () => {
      const updatedButtons = generateButtons().setComponents(
        generateButtons().components[0].setDisabled(true),
        generateButtons().components[1].setDisabled(true)
      );

      await initialMessage.edit({ components: [updatedButtons] });
    });
  },
};
