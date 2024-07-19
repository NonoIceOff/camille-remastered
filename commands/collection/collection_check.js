const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  async execute(interaction) {
    const type = interaction.options.getString("type");
    let collection;
    let title;

    // Determine which collection to use based on type
    switch (type) {
      case "fish":
        collection = await axios.get(`https://zeldaapi.vercel.app/api/items?type=fish`).then(response => response.data);
        title = "Collection de poissons";
        break;
      case "treasure":
        collection = await axios.get(`https://zeldaapi.vercel.app/api/items?type=${type}`).then(response => response.data);
        title = "Collection de trésors";
        break;
      case "fruits":
        collection = await axios.get(`https://zeldaapi.vercel.app/api/items?type=fruit_vegetable`).then(response => response.data);
        title = "Collection de fruits et légumes";
        break;
      case "minecraft":
        collection = await axios.get(`https://zeldaapi.vercel.app/api/items?type=${type}`).then(response => response.data);
        title = "Collection Minecraft";
        break;
      default:
        return interaction.reply({
          content: "Type de collection non valide.",
          ephemeral: true,
        });
    }

    const userId = interaction.user.id;

    let userInventory;
    try {
      const inv = await axios.get(`https://zeldaapi.vercel.app/api/user/${interaction.user.id}/inventory`);
      userInventory = { "items": inv.data };
    } catch (error) {
      console.error(`Error loading user inventory for user ${userId}:`, error);
      return interaction.reply({
        content:
          "Une erreur est survenue lors du chargement de votre inventaire.",
        ephemeral: true,
      });
    }


    // Filter the collection to show only missing items
    const missingItems = collection.filter(
      (item) =>
        !userInventory.items.find((userItem) => userItem.name === item.name)
    );

    const missingCount = missingItems.length;

    if (missingCount === 0) {
      return interaction.reply({
        content: "Félicitations ! Vous avez complété la collection.",
        ephemeral: false,
      });
    }

    let page = 0;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(missingCount / itemsPerPage);

    const generateEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor("#FFD700")
        .setDescription(
          `Il vous manque ${missingCount} items pour compléter la collection.`
        )
        .setFooter({ text: `Page ${page + 1} sur ${totalPages}` });

      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const items = missingItems.slice(start, end);

      items.forEach((item) => {
        embed.addFields({
          name: ` ${item.emoji} ${item.name}`,
          value: `Rareté: ${item.rarity}`,
          inline: true,
        });
      });

      return embed;
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Précédent")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Suivant")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [generateButtons(page)],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", (i) => {
      if (i.customId === "previous" && page > 0) {
        page--;
      } else if (i.customId === "next" && page < totalPages - 1) {
        page++;
      }

      i.update({
        embeds: [generateEmbed(page)],
        components: [generateButtons(page)],
      });
    });

    collector.on("end", () => {
      message.edit({ components: [] });
    });
  },
};
