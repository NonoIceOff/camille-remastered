const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const itemsPerPage = 9; // Nombre d'utilisateurs par page

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply();

    if (!interaction.guild) {
      await interaction.editReply(
        "Cette commande ne peut être utilisée que sur un serveur."
      );
      return;
    }

    try {
      const statsDirectory = "./stats";

      // Lire tous les fichiers JSON dans le dossier stats/
      const files = fs.readdirSync(statsDirectory);

      // Filtrer les fichiers JSON
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      // Initialiser un tableau pour stocker les données de tous les utilisateurs
      let userStatsList = [];

      const response = await axios.get(
        `https://zeldaapi.vercel.app/api/users`
      );
      userStatsList = response.data

      // Trier le tableau par ordre décroissant des coins
      userStatsList.sort((a, b) => b.coins - a.coins);

      // Calculer le nombre total de pages nécessaires pour la pagination
      const totalPages = Math.ceil(userStatsList.length / itemsPerPage);

      let currentPage = 1; // Page actuelle, commence à 1

      const generateEmbedPage = async (startIndex) => {
        const embed = new EmbedBuilder()
          .setTitle("Classement des membres selon les <:gold:1261787387395047424>")
          .setColor("#FFD700")

        const pageItems = userStatsList.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        for (let index = 0; index < pageItems.length; index++) {
          const userStats = pageItems[index];
          try {
            // Récupérer l'utilisateur depuis le cache Discord
            let user = client.users.cache.get(userStats.id);
            let crown = (startIndex + index + 1).toString()+"."
            let inline = true

            if (startIndex == 0 & index == 0) {
              crown = "👑"
              inline = false
            }
            if (startIndex == 0 & index == 1) {
              crown = "🥈"
              inline = false
            }
            if (startIndex == 0 & index == 2) {
              crown = "🥉"
              inline = false
            }

            // Si l'utilisateur n'est pas dans le cache, le récupérer depuis l'API Discord
            if (!user) {
              user = await client.users.fetch(userStats.id);
            }

            // Vérifier à nouveau si l'utilisateur est récupéré avec succès
            if (user) {
              embed.addFields({
                name: `${crown} ${user.displayName}`,
                value: `*${userStats.coins}* <:gold:1261787387395047424>`,
                inline: inline,
              });
            } else {
              embed.addFields({
                name: `${crown} Utilisateur introuvable`,
                value: `*${userStats.coins}* <:gold:1261787387395047424>`,
                inline: inline,
              });
            }
          } catch (error) {
            console.error(
              `Erreur lors de la récupération de l'utilisateur ${userStats.userId} :`,
              error
            );
            embed.addFields({
              name: `${crown} Erreur`,
              value: `*${userStats.coins}* <:gold:1261787387395047424>`,
              inline: inline,
            });
          }
        }

        embed.setFooter({ text: `Page ${currentPage} sur ${totalPages}` });

        return embed;
      };

      // Fonction pour générer les boutons de pagination
      const generateButtons = () =>
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous_page")
            .setLabel("Précédent")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("Suivant")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages)
        );

      // Envoyer le message initial avec la première page et les boutons de pagination
      // Envoyer le message initial avec la première page et les boutons de pagination
      const initialMessage = await interaction.editReply({
        embeds: [await generateEmbedPage(0)], // Utilisation de await ici
        components: [generateButtons()],
      });

      // Créer un collecteur pour gérer les interactions avec les boutons
      const collector = interaction.channel.createMessageComponentCollector({
        filter: (buttonInteraction) =>
          buttonInteraction.isButton() &&
          buttonInteraction.user.id === interaction.user.id,
        time: 60000, // 60 secondes
      });

      // Écouter les événements 'collect' pour les interactions de boutons
      collector.on("collect", async (buttonInteraction) => {
        if (buttonInteraction.customId === "previous_page" && currentPage > 1) {
          currentPage--;
        } else if (
          buttonInteraction.customId === "next_page" &&
          currentPage < totalPages
        ) {
          currentPage++;
        }

        // Mettre à jour le message avec la nouvelle page et les boutons mis à jour
        await buttonInteraction.update({
          embeds: [await generateEmbedPage((currentPage - 1) * itemsPerPage)],
          components: [generateButtons()],
        });
      });

      // Écouter l'événement 'end' du collecteur
      collector.on("end", async () => {
        // Désactiver les boutons de pagination à la fin du collecteur
        const updatedButtons = generateButtons().setComponents(
          generateButtons().components[0].setDisabled(true),
          generateButtons().components[1].setDisabled(true)
        );

        await initialMessage.edit({ components: [updatedButtons] });
      });
    } catch (error) {
      console.error(
        "Une erreur est survenue lors de la récupération du classement des dollars :",
        error
      );
      await interaction.editReply(
        "Une erreur est survenue lors de la récupération du classement."
      );
    }
  },
};
