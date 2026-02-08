/**
 * Admin command - Ban a user
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le membre à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison du bannissement')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('supprimer_messages')
        .setDescription('Nombre de jours de messages à supprimer (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('utilisateur');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
      const deleteMessageDays = interaction.options.getInteger('supprimer_messages') || 0;
      const targetMember = interaction.guild.members.cache.get(targetUser.id);

      // Checks
      if (targetUser.id === interaction.user.id) {
        return interaction.editReply({
          content: '❌ Vous ne pouvez pas vous bannir vous-même.',
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        return interaction.editReply({
          content: '❌ Je ne peux pas me bannir moi-même.',
        });
      }

      if (targetMember && !targetMember.bannable) {
        return interaction.editReply({
          content: '❌ Je ne peux pas bannir ce membre (permissions insuffisantes).',
        });
      }

      // Ban the user
      await interaction.guild.members.ban(targetUser, {
        reason: reason,
        deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
      });

      // Success embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔨 Membre banni')
        .setDescription(`**${targetUser.tag}** a été banni du serveur.`)
        .addFields(
          { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '👮 Modérateur', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Raison', value: reason, inline: false },
          { name: '🗑️ Messages supprimés', value: `${deleteMessageDays} jour(s)`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'ban', {
        target: targetUser.tag,
        reason: reason,
        deleteMessageDays: deleteMessageDays
      });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
