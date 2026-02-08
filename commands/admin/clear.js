/**
 * Admin command - Clear messages
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre spécifique de messages')
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Supprimer uniquement les messages d\'un utilisateur spécifique')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const amount = interaction.options.getInteger('quantite');
      const targetUser = interaction.options.getUser('utilisateur');

      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let messagesToDelete = messages.first(amount);

      // Filter by user if specified
      if (targetUser) {
        messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messagesToDelete = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);

      if (messagesToDelete.length === 0) {
        return interaction.editReply({
          content: '❌ Aucun message à supprimer (les messages de plus de 14 jours ne peuvent pas être supprimés en masse).',
        });
      }

      // Delete messages
      await interaction.channel.bulkDelete(messagesToDelete, true);

      // Success embed
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('🧹 Messages supprimés')
        .setDescription(`**${messagesToDelete.length}** message(s) ont été supprimés.`)
        .addFields(
          { name: '📊 Quantité demandée', value: `${amount}`, inline: true },
          { name: '🗑️ Supprimés', value: `${messagesToDelete.length}`, inline: true },
          { name: '👮 Modérateur', value: `${interaction.user.tag}`, inline: true }
        );

      if (targetUser) {
        embed.addFields({ name: '👤 Utilisateur ciblé', value: targetUser.tag, inline: false });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'clear', {
        amount: messagesToDelete.length,
        targetUser: targetUser?.tag || 'Tous',
        channel: interaction.channel.name
      });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
