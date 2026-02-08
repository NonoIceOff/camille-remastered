/**
 * Admin command - Timeout a user
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Met un membre en timeout')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le membre à timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duree')
        .setDescription('Durée en minutes (max 40320 = 28 jours)')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison du timeout')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('utilisateur');
      const duration = interaction.options.getInteger('duree');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
      const targetMember = interaction.guild.members.cache.get(targetUser.id);

      // Checks
      if (!targetMember) {
        return interaction.editReply({
          content: '❌ Membre introuvable dans le serveur.',
        });
      }

      if (targetUser.id === interaction.user.id) {
        return interaction.editReply({
          content: '❌ Vous ne pouvez pas vous mettre en timeout vous-même.',
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        return interaction.editReply({
          content: '❌ Je ne peux pas me mettre en timeout moi-même.',
        });
      }

      if (!targetMember.moderatable) {
        return interaction.editReply({
          content: '❌ Je ne peux pas mettre ce membre en timeout (permissions insuffisantes).',
        });
      }

      // Apply timeout
      const timeoutDuration = duration * 60 * 1000; // Convert to milliseconds
      await targetMember.timeout(timeoutDuration, reason);

      // Calculate end time
      const endTime = Math.floor((Date.now() + timeoutDuration) / 1000);

      // Success embed
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🔇 Membre en timeout')
        .setDescription(`**${targetUser.tag}** a été mis en timeout.`)
        .addFields(
          { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '👮 Modérateur', value: `${interaction.user.tag}`, inline: true },
          { name: '⏱️ Durée', value: `${duration} minute(s)`, inline: true },
          { name: '⏰ Fin du timeout', value: `<t:${endTime}:R>`, inline: true },
          { name: '📝 Raison', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'timeout', {
        target: targetUser.tag,
        duration: `${duration} minutes`,
        reason: reason
      });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
