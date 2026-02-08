/**
 * Fun command - Random GIF
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

const GIF_CATEGORIES = {
  happy: ['happy', 'excited', 'joy'],
  sad: ['sad', 'crying', 'tears'],
  dance: ['dance', 'dancing', 'party'],
  love: ['love', 'heart', 'romantic'],
  funny: ['funny', 'hilarious', 'laugh'],
  cat: ['cat', 'kitten', 'kitty'],
  dog: ['dog', 'puppy', 'doggo'],
  celebration: ['celebration', 'yay', 'hooray'],
  facepalm: ['facepalm', 'disappointed'],
  gaming: ['gaming', 'gamer', 'videogames']
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Envoie un GIF aléatoire')
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('Catégorie de GIF')
        .setRequired(false)
        .addChoices(
          { name: '😊 Heureux', value: 'happy' },
          { name: '😢 Triste', value: 'sad' },
          { name: '💃 Danse', value: 'dance' },
          { name: '❤️ Amour', value: 'love' },
          { name: '😂 Drôle', value: 'funny' },
          { name: '🐱 Chat', value: 'cat' },
          { name: '🐶 Chien', value: 'dog' },
          { name: '🎉 Célébration', value: 'celebration' },
          { name: '🤦 Facepalm', value: 'facepalm' },
          { name: '🎮 Gaming', value: 'gaming' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const category = interaction.options.getString('categorie') || 'random';
      const searchTerms = GIF_CATEGORIES[category] || ['random', 'funny'];
      const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

      // Note: Tenor API would be better, but this is a fallback
      const gifUrl = `https://tenor.com/view/${searchTerm}-gif`;

      const embed = new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle(`🎬 GIF - ${category.charAt(0).toUpperCase() + category.slice(1)}`)
        .setDescription(`[Cliquez ici pour voir le GIF](${gifUrl})`)
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Add a random tenor search link as a fun alternative
      embed.addFields({
        name: '🔍 Rechercher plus',
        value: `[Rechercher "${searchTerm}" sur Tenor](https://tenor.com/search/${searchTerm}-gifs)`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, 'gif', { category });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
