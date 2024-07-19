const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Affiche différents classements")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("voice")
        .setDescription("Affiche le classement selon le temps passé en vocal")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("gold")
        .setDescription("Affiche le classement selon les <:gold:1261787387395047424>")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("amethyst")
        .setDescription("Affiche le classement selon les <:amethyst:1261787385126060052>")
    ),
  async execute(interaction, client) {
    // Appeler l'exécution de la sous-commande 'voice'
    if (interaction.options.getSubcommand() === "voice") {
      require("./voicerank").execute(interaction, client);
    }
    if (interaction.options.getSubcommand() === "gold") {
      require("./dollarsrank").execute(interaction, client);
    }
    if (interaction.options.getSubcommand() === "amethyst") {
      require("./amethystrank").execute(interaction, client);
    }
  },
};
