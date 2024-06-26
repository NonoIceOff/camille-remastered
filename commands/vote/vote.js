const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Voter pour le serveur et obtenir des récompenses'),

  async execute(interaction) {
  
    await interaction.reply("Pour voter c'est ici : *(mettez bien votre pseudo discord)*\nhttps://serveur-prive.net/discord/joybar-night/vote");
  },
};
