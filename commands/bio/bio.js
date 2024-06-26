const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

const bioCommand = new SlashCommandBuilder()
  .setName('bio')
  .setDescription('Change ta biographie')
  .addStringOption(option => 
    option.setName('texte')
      .setDescription('Le nouveau texte de ta biographie')
      .setRequired(true)
  );

module.exports = {
  data: bioCommand,
  async execute(interaction) {
    const userId = interaction.user.id;
    const newBio = interaction.options.getString('texte');
    const filePath = `stats/user_${userId}.json`;

    // Charger les données existantes ou créer un nouvel objet de stats
    let userStats = {};
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        userStats = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des statistiques de l'utilisateur ${userId}:`, error);
      await interaction.reply("Une erreur est survenue lors de la récupération de vos données.");
      return;
    }

    // Mettre à jour ou ajouter la biographie
    userStats.bio = newBio;

    // Sauvegarder les données mises à jour
    try {
      fs.writeFileSync(filePath, JSON.stringify(userStats, null, 4), 'utf-8');
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des statistiques de l'utilisateur ${userId}:`, error);
      await interaction.reply("Une erreur est survenue lors de la sauvegarde de vos données.");
      return;
    }

    await interaction.reply(`Votre biographie a été mise à jour : ${newBio}`);
  },
};
