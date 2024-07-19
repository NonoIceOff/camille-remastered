const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require("fs");
const path = require("path");
const Canvas = require("@napi-rs/canvas");
const { getColorFromId } = require("../../colorUtils");
const { getUserInfos, modifyUser, changeUserInfos} = require("../../utils/user.js")

// Paramètres pour le calcul de l'XP nécessaire pour le prochain niveau
const baseXP = 1000; // XP de base pour passer du niveau 1 au niveau 2
const growthFactor = 1.5; // Facteur de croissance pour l'XP nécessaire à chaque niveau

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Affiche les statistiques de coins"),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    let userInfos = await getUserInfos(userId);

    const userCoins = userInfos.coins || 0;
    const userAmethyst = userInfos.amethyst || 0;
    const userMessages = userInfos.messages || 0;
    const userBadges = userInfos.badges || {};
    const userBio = userInfos.bio || "Aucune bio définie";

    var valueBadge = "Aucun"
    if (userBadges != {}) {
      valueBadge = " "
      Object.entries(userBadges).forEach(([key, value]) => {
        valueBadge += `${value[1]} **${key}** *(niv${value[0]})*`
        console.log(key, value);
      });
    } else {
      valueBadge = "Aucun"
    }


    const embed = new EmbedBuilder()
    .setTitle(`Statistiques de ${interaction.user.displayName}`)
    .setColor('#FFD700')
    .setThumbnail(interaction.user.avatarURL());

    embed.addFields({
      name: `Profil`,
      value: `${interaction.user.username}\n*${userBio}*`,
      inline: true,
    });
    embed.addFields({
      name: `Stats`,
      value: `${userCoins} <:gold:1261787387395047424>\n${userAmethyst} <:amethyst:1261787385126060052>\n${userMessages} messages`,
      inline: true,
    });
    embed.addFields({
      name: `Badges`,
      value: valueBadge,
      inline: false,
    });

    

    await interaction.editReply({ embeds: [embed] });
  },
};
