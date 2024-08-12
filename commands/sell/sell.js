const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Affiche différents classements")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("dry")
        .setDescription("Simule la vente de tous tes items")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("inventory")
        .setDescription("Vend tous tes items (d'une rareté ou non) de ton inventaire, toutes collections confondues.")
        .addStringOption((option) =>
          option
            .setName("rarity")
            .setDescription(
              "Rareté des articles à vendre (laissez vide pour tout vendre)"
            )
            .setRequired(false)
            .addChoices(
              { name: "commun", value: "commun" },
              { name: "peu commun", value: "peu commun" },
              { name: "rare", value: "rare" },
              { name: "très rare", value: "très rare" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("double")
        .setDescription("Vend tous tes items en double")
    ),
  async execute(interaction, client) {
    await interaction.reply({
      content:
        "Commande bloquée",
      embeds: [],
      components: [],
    });
    // Appeler l'exécution de la sous-commande 'voice'
    //if (interaction.options.getSubcommand() === "dry") {
    //  require("./sell_dry").execute(interaction, client);
    //}
    //if (interaction.options.getSubcommand() === "inventory") {
    //  require("./sell_inventory").execute(interaction, client);
    //}
    //if (interaction.options.getSubcommand() === "double") {
    //  require("./sell_double").execute(interaction, client);
    //}
  },
};
