/**
 * Fun command - Avatar display
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Affiche l\'avatar d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur dont vous voulez voir l\'avatar')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
      
      // Fetch full user for banner
      const fetchedUser = await targetUser.fetch();

      const avatarURL = targetUser.displayAvatarURL({ 
        dynamic: true, 
        size: 4096 
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Avatar de ${targetUser.tag}`)
        .setDescription(`[Télécharger en haute qualité](${avatarURL})`)
        .setImage(avatarURL)
        .setTimestamp()
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'avatar', { target: targetUser.tag });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
