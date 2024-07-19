const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const roles = {
  role1: { id: "1258133421301956608" },
  role2: { id: "1258133461684846742" },
  role3: { id: "1258134206811475991" },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("Changer la couleur de votre profil")
    .addIntegerOption((option) =>
      option
        .setName("red")
        .setDescription("Valeur de rouge (0-255)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("green")
        .setDescription("Valeur de vert (0-255)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("blue")
        .setDescription("Valeur de bleu (0-255)")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const userId = interaction.user.id;
    const statsDir = "stats";
    const userStatsFilePath = path.join(
      __dirname,
      "../..",
      statsDir,
      `user_${userId}.json`
    );

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

    const red = interaction.options.getInteger("red");
    const green = interaction.options.getInteger("green");
    const blue = interaction.options.getInteger("blue");

    if (
      red < 0 ||
      red > 255 ||
      green < 0 ||
      green > 255 ||
      blue < 0 ||
      blue > 255
    ) {
      await interaction.reply({
        content: "Les valeurs RGB doivent être comprises entre 0 et 255.",
        ephemeral: true,
      });
      return;
    }

    let stats;

    try {
      // Charger les statistiques de l'utilisateur depuis le fichier
      const statsFileContent = fs.readFileSync(userStatsFilePath, "utf-8");
      stats = JSON.parse(statsFileContent);
    } catch (error) {
      console.error(
        `Erreur lors du chargement des statistiques de l'utilisateur ${userId}:`,
        error
      );
      await interaction.reply("Erreur lors du chargement de vos statistiques.");
      return;
    }

    // Mettre à jour la couleur dans les statistiques de l'utilisateur
    stats.color = `rgb(${red}, ${green}, ${blue})`;

    // Sauvegarder les statistiques mises à jour dans le fichier
    try {
      fs.writeFileSync(userStatsFilePath, JSON.stringify(stats, null, 2));
      await interaction.reply(
        `Votre couleur a été mise à jour : rgb(${red}, ${green}, ${blue})`
      );
    } catch (error) {
      console.error(
        `Erreur lors de la sauvegarde des statistiques de l'utilisateur ${userId}:`,
        error
      );
      await interaction.reply(
        "Erreur lors de la mise à jour de votre couleur."
      );
    }
  },
};
