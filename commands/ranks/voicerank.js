const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require("axios");

const itemsPerPage = 9; // Nombre d'utilisateurs par page

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const statsDirectory = './stats';
      const files = fs.readdirSync(statsDirectory);

      // Initialiser un tableau pour stocker les données de tous les utilisateurs
      let usersData = [];

      const response = await axios.get(
        `https://zeldaapi.vercel.app/api/users`
      );
      usersData = response.data

      // Trier les utilisateurs par temps vocal décroissant
      usersData.sort((a, b) => b.voicetime - a.voicetime);

      // Calculer le nombre total de pages nécessaires pour la pagination
      const totalPages = Math.ceil(usersData.length / itemsPerPage);

      let currentPage = 1; // Page actuelle, commence à 1

      const generateEmbedPage = async (startIndex) => {
        const embed = new EmbedBuilder()
          .setTitle('Classement des membres selon le temps passé en vocal')
          .setColor('#FFD700');

        const pageItems = usersData.slice(startIndex, startIndex + itemsPerPage);

        for (let index = 0; index < pageItems.length; index++) {
          const userStats = pageItems[index];
          try {
            // Récupérer l'utilisateur depuis le cache Discord
            let member = interaction.guild.members.cache.get(userStats.id);
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

            // Si le membre n'est pas dans le cache, le récupérer depuis l'API Discord
            if (!member) {
              member = await interaction.guild.members.fetch(userStats.id);
            }

            // Vérifier à nouveau si le membre est récupéré avec succès
            if (member) {
              const formattedTime = formatTime(userStats.voicetime);
              const dollarsEarned = Math.floor(userStats.voicetime / 60) * 2; // Supposons que chaque minute vaut 2 dollars

              embed.addFields({
                name: `${crown} ${member.displayName}`,
                value: `Temps passé : *${formattedTime}*\nDollars gagnés : *${dollarsEarned} :dollar:*`,
                inline: inline,
              });
            } else {
              
            }
          } catch (error) {
            
          }
        }

        embed.setFooter({ text: `Page ${currentPage} sur ${totalPages}` });

        return embed;
      };

      // Fonction pour générer les boutons de pagination
      const generateButtons = () =>
        new ActionRowBuilder().addComponents(
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
      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.customId === 'previous_page' && currentPage > 1) {
          currentPage--;
        } else if (buttonInteraction.customId === 'next_page' && currentPage < totalPages) {
          currentPage++;
        }

        // Mettre à jour le message avec la nouvelle page et les boutons mis à jour
        await buttonInteraction.update({
          embeds: [await generateEmbedPage((currentPage - 1) * itemsPerPage)],
          components: [generateButtons()],
        });
      });

      // Écouter l'événement 'end' du collecteur
      collector.on('end', async () => {
        // Désactiver les boutons de pagination à la fin du collecteur
        const updatedButtons = generateButtons().setComponents(
          generateButtons().components[0].setDisabled(true),
          generateButtons().components[1].setDisabled(true)
        );

        await initialMessage.edit({ components: [updatedButtons] });
      });
    } catch (error) {
      console.error('Une erreur est survenue lors de la récupération du classement des membres selon le temps passé en vocal :', error);
      await interaction.editReply('Une erreur est survenue lors de la récupération du classement.');
    }
  },
};

// Fonction utilitaire pour formater le temps en heures, minutes et secondes
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${Math.floor(remainingSeconds)}s`;
}

