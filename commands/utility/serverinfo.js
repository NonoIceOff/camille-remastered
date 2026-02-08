/**
 * Utility command - Server Info
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Affiche les informations du serveur'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const { guild } = interaction;

      // Fetch owner
      const owner = await guild.fetchOwner();

      // Count channels
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const categories = guild.channels.cache.filter(c => c.type === 4).size;

      // Count members
      const totalMembers = guild.memberCount;
      const botCount = guild.members.cache.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      // Count roles
      const roleCount = guild.roles.cache.size;

      // Count emojis
      const emojiCount = guild.emojis.cache.size;
      const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
      const staticEmojis = emojiCount - animatedEmojis;

      // Server boost info
      const boostTier = guild.premiumTier;
      const boostCount = guild.premiumSubscriptionCount || 0;

      // Verification level
      const verificationLevels = {
        0: 'Aucune',
        1: 'Faible',
        2: 'Moyen',
        3: 'Élevé',
        4: 'Très élevé'
      };
      const verificationLevel = verificationLevels[guild.verificationLevel] || 'Inconnue';

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📊 Informations sur ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: '👑 Propriétaire',
            value: `${owner.user.tag}`,
            inline: true
          },
          {
            name: '📅 Création',
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
            inline: true
          },
          {
            name: '🆔 ID',
            value: `\`${guild.id}\``,
            inline: true
          },
          {
            name: '👥 Membres',
            value: `Total: **${totalMembers}**\n👤 Humains: **${humanCount}**\n🤖 Bots: **${botCount}**`,
            inline: true
          },
          {
            name: '📁 Salons',
            value: `💬 Textuels: **${textChannels}**\n🔊 Vocaux: **${voiceChannels}**\n📂 Catégories: **${categories}**`,
            inline: true
          },
          {
            name: '🎭 Rôles',
            value: `**${roleCount}** rôle(s)`,
            inline: true
          },
          {
            name: '😀 Emojis',
            value: `Total: **${emojiCount}**\n🎨 Statiques: **${staticEmojis}**\n✨ Animés: **${animatedEmojis}**`,
            inline: true
          },
          {
            name: '🚀 Boosts',
            value: `Niveau: **${boostTier}**\nBoosts: **${boostCount}**`,
            inline: true
          },
          {
            name: '🛡️ Vérification',
            value: verificationLevel,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      // Add banner if exists
      if (guild.banner) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
      }

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'serverinfo');

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
