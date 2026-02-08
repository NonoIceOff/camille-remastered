const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot et les statistiques de performance'),

  async execute(interaction) {
    try {
      const sent = await interaction.reply({ 
        content: '🏓 Calcul de la latence...', 
        fetchReply: true 
      });

      const client = interaction.client;
      const wsLatency = client.ws.ping;
      const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;

      // Determine color based on latency
      let color = '#4CAF50'; // Green - Good
      if (wsLatency > 200 || apiLatency > 200) {
        color = '#FFA500'; // Orange - Average
      }
      if (wsLatency > 500 || apiLatency > 500) {
        color = '#FF0000'; // Red - Poor
      }

      // Calculate uptime
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor(uptime / 3600) % 24;
      const minutes = Math.floor(uptime / 60) % 60;
      const seconds = Math.floor(uptime % 60);
      const uptimeStr = `${days}j ${hours}h ${minutes}m ${seconds}s`;

      // Memory usage
      const memUsage = process.memoryUsage();
      const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
      const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🏓 Pong!')
        .setDescription('Statistiques de performance du bot')
        .addFields(
          {
            name: '📡 Latence WebSocket',
            value: `\`${wsLatency}ms\``,
            inline: true
          },
          {
            name: '⚡ Latence API',
            value: `\`${apiLatency}ms\``,
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value: `\`${uptimeStr}\``,
            inline: true
          },
          {
            name: '💾 Mémoire',
            value: `\`${memUsed}MB / ${memTotal}MB\``,
            inline: true
          },
          {
            name: '📊 Serveurs',
            value: `\`${client.guilds.cache.size}\``,
            inline: true
          },
          {
            name: '👥 Utilisateurs',
            value: `\`${client.users.cache.size}\``,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      await interaction.editReply({ content: null, embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'ping', { wsLatency, apiLatency });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
