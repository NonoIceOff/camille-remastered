/**
 * Utility command - Uptime display
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Affiche le temps de fonctionnement du bot'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor(uptime / 3600) % 24;
      const minutes = Math.floor(uptime / 60) % 60;
      const seconds = Math.floor(uptime % 60);

      const startTime = Date.now() - (uptime * 1000);
      const startTimestamp = Math.floor(startTime / 1000);

      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('⏱️ Temps de fonctionnement')
        .setDescription('Statistiques d\'uptime du bot')
        .addFields(
          {
            name: '🕐 Durée totale',
            value: `\`${days}j ${hours}h ${minutes}m ${seconds}s\``,
            inline: false
          },
          {
            name: '🚀 Démarré le',
            value: `<t:${startTimestamp}:F>`,
            inline: false
          },
          {
            name: '📅 Il y a',
            value: `<t:${startTimestamp}:R>`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'uptime');

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
