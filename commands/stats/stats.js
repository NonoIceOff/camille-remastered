const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques de coins'),

  async execute(interaction) {
    const userId = interaction.user.id;
    
    // Charger le fichier user_${userId}.json
    const userStatsFilePath = `stats/user_${userId}.json`;
    let userStats = {};
    try {
      const userStatsFileContent = fs.readFileSync(userStatsFilePath, 'utf-8');
      userStats = JSON.parse(userStatsFileContent);
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier ${userStatsFilePath} :`, error);
      return interaction.reply('Une erreur s\'est produite lors de la récupération des statistiques.');
    }

    // Récupérer le nombre de coins de l'utilisateur
    const userCoins = userStats.coins || 0;
    const userLevel = userStats.level || 0;
    const userBio = userStats.bio || "Aucune bio définie";

    // Créer un embed Discord avec EmbedBuilder et plusieurs champs
    const embed = new EmbedBuilder()
      .setColor(0xA020F0)
      .setTitle(`Statistiques pour ${interaction.user.username}`)
      .addFields(
        { name: 'Nombre de coins', value: userCoins.toString() },
        { name: 'Niveau', value: userLevel.toString() },
        { name: 'Bio', value: userBio },
      );

    // Répondre à l'interaction avec l'embed
    await interaction.reply({ embeds: [embed] });
  },
};
