/**
 * Utility command - User Info
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les informations d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur dont vous voulez voir les informations')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
      const targetMember = interaction.guild.members.cache.get(targetUser.id);

      if (!targetMember) {
        return interaction.editReply({
          content: '❌ Membre introuvable dans le serveur.',
        });
      }

      // Get roles (excluding @everyone)
      const roles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 10); // Limit to 10 roles

      const roleDisplay = roles.length > 0 
        ? roles.join(', ') + (targetMember.roles.cache.size > 11 ? ` +${targetMember.roles.cache.size - 11}` : '')
        : 'Aucun rôle';

      // Get key permissions
      const keyPermissions = [];
      if (targetMember.permissions.has('Administrator')) keyPermissions.push('Administrateur');
      if (targetMember.permissions.has('ManageGuild')) keyPermissions.push('Gérer le serveur');
      if (targetMember.permissions.has('ManageRoles')) keyPermissions.push('Gérer les rôles');
      if (targetMember.permissions.has('ManageChannels')) keyPermissions.push('Gérer les salons');
      if (targetMember.permissions.has('KickMembers')) keyPermissions.push('Expulser des membres');
      if (targetMember.permissions.has('BanMembers')) keyPermissions.push('Bannir des membres');
      if (targetMember.permissions.has('ModerateMembers')) keyPermissions.push('Modérer les membres');

      const permissionDisplay = keyPermissions.length > 0 
        ? keyPermissions.join(', ') 
        : 'Aucune permission clé';

      // User badges
      const badges = [];
      const flags = targetUser.flags?.toArray() || [];
      const badgeEmojis = {
        Staff: '👨‍💼',
        Partner: '🤝',
        Hypesquad: '⚡',
        BugHunterLevel1: '🐛',
        BugHunterLevel2: '🐛',
        HypeSquadOnlineHouse1: '🏠',
        HypeSquadOnlineHouse2: '🏠',
        HypeSquadOnlineHouse3: '🏠',
        PremiumEarlySupporter: '⭐',
        VerifiedDeveloper: '✅',
        CertifiedModerator: '🛡️'
      };

      flags.forEach(flag => {
        if (badgeEmojis[flag]) {
          badges.push(badgeEmojis[flag]);
        }
      });

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(targetMember.displayHexColor || '#5865F2')
        .setTitle(`👤 Informations sur ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: '🆔 ID',
            value: `\`${targetUser.id}\``,
            inline: true
          },
          {
            name: '📛 Pseudo',
            value: targetUser.username,
            inline: true
          },
          {
            name: '🏷️ Tag',
            value: `#${targetUser.discriminator}`,
            inline: true
          },
          {
            name: '📅 Compte créé',
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>\n<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
            inline: true
          },
          {
            name: '📆 A rejoint le serveur',
            value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>\n<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
            inline: true
          },
          {
            name: '🤖 Bot',
            value: targetUser.bot ? 'Oui' : 'Non',
            inline: true
          },
          {
            name: `🎭 Rôles [${targetMember.roles.cache.size - 1}]`,
            value: roleDisplay,
            inline: false
          },
          {
            name: '🔑 Permissions clés',
            value: permissionDisplay,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      // Add badges if any
      if (badges.length > 0) {
        embed.addFields({
          name: '🏅 Badges',
          value: badges.join(' '),
          inline: false
        });
      }

      // Add banner if exists
      const fetchedUser = await targetUser.fetch();
      if (fetchedUser.banner) {
        embed.setImage(fetchedUser.bannerURL({ size: 1024 }));
      }

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'userinfo', { target: targetUser.tag });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
