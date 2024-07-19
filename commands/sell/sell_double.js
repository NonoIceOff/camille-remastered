const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const {
  getUserInfos,
  modifyUser,
  changeUserInfos,
} = require("../../utils/user.js");
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

    let multiplier = 0.5; // Valeur de base
    for (const roleKey in roles) {
      const role = roles[roleKey];
      if (interaction.member.roles.cache.has(role.id)) {
        multiplier = role.multiplier;
        break;
      }
    }

    let totalValue = 0;
    const itemsToSell = [];
    const itemsToRemove = [];

    inventory.items.forEach((item, index) => {
      if (item.quantity > 1) {
        const shopItem = shopItems.find(
          (shopItem) => shopItem.name === item.name
        );
        if (shopItem) {
          totalValue += shopItem.price * multiplier * (item.quantity - 1);
          itemsToSell.push({ ...item, quantity: item.quantity - 1 });
          itemsToRemove.push(index);
        }
      }
    });

    if (totalValue > 0) {
      const itemsPerPage = 25;
      const totalPages = Math.ceil(itemsToSell.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const embed = new EmbedBuilder()
          .setTitle("Confirmation de la vente")
          .setDescription(
            `Vous allez vendre les items suivants pour un total de ${totalValue} <:gold:1261787387395047424> :`
          )
          .setColor("#FFD700")
          .setFooter({ text: `Page ${page + 1} sur ${totalPages}` });

        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const items = itemsToSell.slice(start, end);

        items.forEach((item) => {
          embed.addFields({
            name: `${item.emoji} ${item.name} *x${item.quantity}*`,
            value: `${
              item.price * item.quantity * multiplier
            } <:gold:1261787387395047424>`,
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
            .setDisabled(page === totalPages - 1),

          new ButtonBuilder()
            .setCustomId("cancel_sell")
            .setLabel("Annuler")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("confirm_sell")
            .setLabel("Confirmer")
            .setStyle(ButtonStyle.Success)
        );
      };

      const message = await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
        fetchReply: true,
      });

      const collector = message.createMessageComponentCollector({
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "previous" && currentPage > 0) {
          currentPage--;
        } else if (i.customId === "next" && currentPage < totalPages - 1) {
          currentPage++;
        } else if (i.customId === "confirm_sell") {
          // Mettre à jour l'inventaire de l'utilisateur
          for (const item of itemsToSell) {
            try {
              await axios.post(
                `https://zeldaapi.vercel.app/api/remove_item/${userId}`,
                {
                  itemId: item.id,
                  quantity: item.quantity,
                }
              );
            } catch (error) {
              console.error(
                `Error removing item ${item.id} from user ${userId}:`,
                error
              );
            }
          }

          await changeUserInfos(
            interaction.user.id,
            totalValue,
            "",
            "",
            0,
            0,
            0
          );

          await i.update({
            content: `Vous avez vendu tous vos items en double pour un total de ${totalValue} <:gold:1261787387395047424>.`,
            embeds: [],
            components: [],
          });
          return;
        } else if (i.customId === "cancel_sell") {
          await i.update({
            content: "La vente a été annulée.",
            embeds: [],
            components: [],
          });
          return;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await interaction.editReply({
            content:
              "La vente a été annulée car aucune confirmation n'a été reçue.",
            embeds: [],
            components: [],
          });
        }
      });
    } else {
      await interaction.reply("Vous n'avez aucun item en double à vendre.");
    }
  },
};
