const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("Affiche différents classements")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("Montre la collection possible")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Le type de collection à afficher")
            .setRequired(true)
            .addChoices(
              { name: "Poissons", value: "fish" },
              { name: "Trésors", value: "treasure" },
              { name: "Fruits & légumes", value: "fruits" },
              { name: "Minecraft", value: "minecraft" },
              { name: "Pays", value: "country" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription(
          "Montre les items manquants de votre collection"
        )
        .addStringOption((option) =>
            option
              .setName("type")
              .setDescription("Le type de collection à afficher")
              .setRequired(true)
              .addChoices(
                { name: "Poissons", value: "fish" },
                { name: "Trésors", value: "treasure" },
                { name: "Fruits & légumes", value: "fruits" },
                { name: "Minecraft", value: "minecraft" },
                { name: "Pays", value: "country" }
              )
          )
    ),
  async execute(interaction, client) {
    // Appeler l'exécution de la sous-commande 'voice'
    if (interaction.options.getSubcommand() === "view") {
      require("./collection_view").execute(interaction, client);
    }
    if (interaction.options.getSubcommand() === "check") {
        require("./collection_check").execute(interaction, client);
      }
  },
};
