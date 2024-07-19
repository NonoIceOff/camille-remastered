const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dollar")
    .setDescription("Comment gagner des <:gold:1261787387395047424>"),

  async execute(interaction) {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle("**Comment gagner des <:gold:1261787387395047424> ?**")
      .setColor("#FFD700")

    embed.addFields({
      name: `En envoyant un message`,
      value: `Selon la longueur du message - Une dizaine de <:gold:1261787387395047424>`,
      inline: false,
    });
    embed.addFields({
      name: `En restant dans un vocal`,
      value: `2 <:gold:1261787387395047424> par minute`,
      inline: false,
    });
    embed.addFields({
      name: `En votant pour le serveur`,
      value: `500 <:gold:1261787387395047424>, cooldown d'1h30`,
      inline: false,
    });
    embed.addFields({
      name: `En souhaitant la bienvenue aux nouveaux`,
      value: `_ <:gold:1261787387395047424>`,
      inline: false,
    });
    embed.addFields({
      name: `En répondant aux sondages`,
      value: `_ <:gold:1261787387395047424>`,
      inline: false,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
