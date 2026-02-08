/**
 * Admin command - Kick a user
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre du serveur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le membre à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison de l\'expulsion')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('utilisateur');
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
          content: '❌ Vous ne pouvez pas vous expulser vous-même.',
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        return interaction.editReply({
          content: '❌ Je ne peux pas m\'expulser moi-même.',
        });
      }

      if (!targetMember.kickable) {
        return interaction.editReply({
          content: '❌ Je ne peux pas expulser ce membre (permissions insuffisantes).',
        });
      }

      // Kick the member
      await targetMember.kick(reason);

      // Success embed
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🔨 Membre expulsé')
        .setDescription(`**${targetUser.tag}** a été expulsé du serveur.`)
        .addFields(
          { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '👮 Modérateur', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Raison', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'kick', {
        target: targetUser.tag,
        reason: reason
      });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
