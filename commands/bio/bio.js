const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

const roles = {
  role1: { id: "1258133421301956608" },
  role2: { id: "1258133461684846742" },
  role3: { id: "1258134206811475991" },
};

const bioCommand = new SlashCommandBuilder()
  .setName("bio")
  .setDescription("Change ta biographie")
  .addStringOption((option) =>
    option
      .setName("texte")
      .setDescription("Le nouveau texte de ta biographie")
      .setRequired(true)
  );

module.exports = {
  data: bioCommand,
  async execute(interaction) {
    const userId = interaction.user.id;
    const newBio = interaction.options.getString("texte");
    const filePath = `stats/user_${userId}.json`;

    // Vérifier si l'utilisateur a l'un des rôles requis
    const memberRoles = interaction.member.roles.cache;
    const hasRequiredRole = Object.values(roles).some((role) =>
      memberRoles.has(role.id)
    );

    if (!hasRequiredRole) {
      await interaction.reply({
        content:
          "Vous n'avez pas les permissions nécessaires pour utiliser cette commande.",
        ephemeral: true,
      });
      return;
    }

    // Charger les données existantes ou créer un nouvel objet de stats
    let userStats = {};
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        userStats = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement des statistiques de l'utilisateur ${userId}:`,
        error
      );
      await interaction.reply(
        "Une erreur est survenue lors de la récupération de vos données."
      );
      return;
    }

    // Mettre à jour ou ajouter la biographie
    userStats.bio = newBio;

    // Sauvegarder les données mises à jour
    try {
      fs.writeFileSync(filePath, JSON.stringify(userStats, null, 4), "utf-8");
    } catch (error) {
      console.error(
        `Erreur lors de la sauvegarde des statistiques de l'utilisateur ${userId}:`,
        error
      );
      await interaction.reply(
        "Une erreur est survenue lors de la sauvegarde de vos données."
      );
      return;
    }

    await interaction.reply(`Votre biographie a été mise à jour : ${newBio}`);
  },
};
