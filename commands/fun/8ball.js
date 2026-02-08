/**
 * Fun command - 8ball
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');

const RESPONSES = {
  positive: [
    'Oui, absolument!',
    'C\'est certain.',
    'Sans aucun doute.',
    'Oui, définitivement.',
    'Tu peux compter dessus.',
    'À mon avis, oui.',
    'Très probablement.',
    'Les perspectives sont bonnes.',
    'Les signes pointent vers oui.',
    'Oui!'
  ],
  neutral: [
    'Réessaie plus tard.',
    'Mieux vaut ne pas te le dire maintenant.',
    'Impossible de prédire pour le moment.',
    'Concentre-toi et redemande.',
    'Demande à nouveau.',
    'Les étoiles ne sont pas alignées.',
    'La réponse est floue.',
    'C\'est incertain.'
  ],
  negative: [
    'Non.',
    'Ma réponse est non.',
    'Mes sources disent non.',
    'Les perspectives ne sont pas bonnes.',
    'Très douteux.',
    'N\'y compte pas.',
    'Ma réponse est définitivement non.',
    'C\'est peu probable.'
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pose une question à la boule magique')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Ta question')
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const question = interaction.options.getString('question');

      // Random response type
      const types = ['positive', 'neutral', 'negative'];
      const weights = [0.4, 0.3, 0.3]; // 40% positive, 30% neutral, 30% negative
      
      const random = Math.random();
      let responseType;
      let cumulative = 0;
      
      for (let i = 0; i < types.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          responseType = types[i];
          break;
        }
      }

      const responses = RESPONSES[responseType];
      const answer = responses[Math.floor(Math.random() * responses.length)];

      // Color based on response type
      const colors = {
        positive: '#4CAF50',
        neutral: '#FFA500',
        negative: '#FF5252'
      };

      const emojis = {
        positive: '✅',
        neutral: '❔',
        negative: '❌'
      };

      const embed = new EmbedBuilder()
        .setColor(colors[responseType])
        .setTitle(`🎱 Boule Magique 8`)
        .addFields(
          {
            name: '❓ Question',
            value: question,
            inline: false
          },
          {
            name: `${emojis[responseType]} Réponse`,
            value: `*${answer}*`,
            inline: false
          }
        )
        .setFooter({ 
          text: `Demandé par ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log
      logger.command(interaction.user.id, '8ball', { 
        question: question.substring(0, 50),
        responseType 
      });

    } catch (error) {
      await ErrorHandler.handleInteractionError(interaction, error);
    }
  },
};
