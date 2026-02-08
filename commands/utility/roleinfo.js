/**
 * Utility command - Role Info
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Affiche les informations d\'un rôle')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Le rôle dont vous voulez voir les informations')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const role = interaction.options.getRole('role');

      // Count members with this role
      const membersWithRole = interaction.guild.members.cache.filter(
        member => member.roles.cache.has(role.id)
      ).size;

      // Check if role is mentionable
      const mentionable = role.mentionable ? 'Oui' : 'Non';
      const hoisted = role.hoist ? 'Oui' : 'Non';
      const managed = role.managed ? 'Oui (Bot/Intégration)' : 'Non';

      // Get permissions
      const permissions = role.permissions.toArray();
      const keyPermissions = permissions.slice(0, 10).map(p => `\`${p}\``).join(', ');
      const permDisplay = permissions.length > 10 
        ? `${keyPermissions} +${permissions.length - 10} autre(s)`
        : keyPermissions || 'Aucune permission spéciale';

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(role.hexColor || '#99AAB5')
        .setTitle(`🎭 Informations sur le rôle`)
        .setDescription(`**${role.name}**`)
        .addFields(
          {
            name: '🆔 ID',
            value: `\`${role.id}\``,
            inline: true
          },
          {
            name: '🎨 Couleur',
            value: role.hexColor || 'Aucune',
            inline: true
          },
          {
            name: '👥 Membres',
            value: `${membersWithRole}`,
            inline: true
          },
          {
            name: '📅 Créé le',
            value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`,
            inline: true
          },
          {
            name: '📊 Position',
            value: `${role.position}`,
            inline: true
          },
          {
            name: '📱 Mention',
            value: mentionable,
            inline: true
          },
          {
            name: '📌 Affiché séparément',
            value: hoisted,
            inline: true
          },
          {
            name: '🤖 Géré automatiquement',
            value: managed,
            inline: true
          },
          {
            name: '🔐 Permissions',
            value: permDisplay,
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
      logger.command(interaction.user.id, 'roleinfo', { role: role.name });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
