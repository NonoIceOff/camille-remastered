const fs = require('fs');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, EmbedBuilder } = require('discord.js');
const axios = require("axios");

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Affiche ton inventaire.');

const itemsPerPage = 10; // Customize the number of items per page

const rarityOrder = ['commun', 'peu commun', 'rare', 'très rare'];

module.exports = {
  data: inventoryCommand,
  async execute(interaction) {
    const userId = interaction.user.id;

    const response =  await axios.get(`https://zeldaapi.vercel.app/api/user/${userId}/inventory`);
    let inventory = {"items":response.data}

    if (!inventory.items || inventory.items.length === 0) {
      await interaction.reply("Ton inventaire est vide !");
      return;
    }

    // Sort items by rarity
    inventory.items.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

    const totalPages = Math.ceil(inventory.items.length / itemsPerPage);
    let currentPage = 1;

    const generateEmbedPage = (startIndex) => {
      const embed = new EmbedBuilder()
        .setTitle("Ton inventaire")
        .setColor("#FFD700")

      const pageItems = inventory.items.slice(startIndex, startIndex + itemsPerPage);

      pageItems.forEach((item, index) => {
        embed.addFields({ name: `${startIndex + index}. ${item.name} ${item.emoji}`, value: `(x${item.quantity}) ${item.rarity}`, inline: true });
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
