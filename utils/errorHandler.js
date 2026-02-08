/**
 * Global error handler for the bot
 * @module utils/errorHandler
 */

const logger = require('./logger');
const { EmbedBuilder } = require('discord.js');

class ErrorHandler {
  /**
   * Handle interaction errors
   */
  static async handleInteractionError(interaction, error) {
    logger.error('INTERACTION', `Error in ${interaction.commandName}:`, {
      error: error.message,
      stack: error.stack,
      userId: interaction.user.id,
      guildId: interaction.guildId
    });

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Une erreur est survenue')
      .setDescription('Une erreur inattendue s\'est produite lors de l\'exécution de cette commande.')
      .addFields({
        name: 'Support',
        value: 'Si le problème persiste, contactez un administrateur.'
      })
      .setTimestamp();

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (followUpError) {
      logger.error('ERROR_HANDLER', 'Failed to send error message to user', followUpError);
    }
  }

  /**
   * Handle command not found
   */
  static async handleCommandNotFound(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚠️ Commande introuvable')
      .setDescription('Cette commande n\'existe pas ou n\'est plus disponible.')
      .setTimestamp();

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('ERROR_HANDLER', 'Failed to send command not found message', error);
    }
  }

  /**
   * Handle permission errors
   */
  static async handlePermissionError(interaction, requiredPermission) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🚫 Permission refusée')
      .setDescription(`Vous n'avez pas la permission requise pour utiliser cette commande.`)
      .addFields({
        name: 'Permission requise',
        value: requiredPermission || 'Non spécifiée'
      })
      .setTimestamp();

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('ERROR_HANDLER', 'Failed to send permission error message', error);
    }
  }

  /**
   * Handle cooldown errors
   */
  static async handleCooldownError(interaction, timeLeft) {
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⏱️ Cooldown actif')
      .setDescription(`Veuillez patienter ${timeLeft.toFixed(1)} secondes avant de réutiliser cette commande.`)
      .setTimestamp();

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('ERROR_HANDLER', 'Failed to send cooldown message', error);
    }
  }

  /**
   * Handle API errors
   */
  static handleAPIError(context, error) {
    logger.apiError('API', context, error);
    
    if (error.response) {
      logger.error('API_RESPONSE', 'API returned error', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalHandlers(client) {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('PROCESS', 'Uncaught Exception:', error);
      // Don't exit, just log
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('PROCESS', 'Unhandled Rejection:', { reason, promise });
    });

    // Discord.js errors
    client.on('error', (error) => {
      logger.error('CLIENT', 'Discord client error:', error);
    });

    client.on('warn', (info) => {
      logger.warn('CLIENT', 'Discord client warning:', info);
    });

    logger.success('ERROR_HANDLER', 'Global error handlers initialized');
  }
}

module.exports = ErrorHandler;
