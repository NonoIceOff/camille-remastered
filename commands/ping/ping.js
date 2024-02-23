const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot'),
  async execute(interaction) {
    const client = interaction.client;
    const ping = client.ws.ping;
    await interaction.reply(`Latence du bot : ${ping}ms`);
  },
};
