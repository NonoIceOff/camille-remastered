const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const path = require("path");
const Canvas = require("@napi-rs/canvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Affiche les statistiques de coins"),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Charger le fichier user_${userId}.json
    const userStatsFilePath = `stats/user_${userId}.json`;
    let userStats = {};
    try {
      const userStatsFileContent = fs.readFileSync(userStatsFilePath, "utf-8");
      userStats = JSON.parse(userStatsFileContent);
    } catch (error) {
      console.error(
        `Erreur lors de la lecture du fichier ${userStatsFilePath} :`,
        error
      );
      return interaction.reply(
        "Une erreur s'est produite lors de la récupération des statistiques."
      );
    }

    // Récupérer le nombre de coins de l'utilisateur
    const userCoins = userStats.coins || 0;
    const userLevel = userStats.level || 0;
    const userBio = userStats.bio || "Aucune bio définie";

    // Créer un embed Discord avec EmbedBuilder et plusieurs champs
    const embed = new EmbedBuilder()
      .setColor(0xa020f0)
      .setTitle(`Statistiques pour ${interaction.user.username}`)
      .addFields(
        { name: "Nombre de coins", value: userCoins.toString() },
        { name: "Niveau", value: userLevel.toString() },
        { name: "Bio", value: userBio }
      );

    const font = "Poppins";
    const canvas = Canvas.createCanvas(200, 200); // Augmenter la taille du canvas pour plus de place
    const context = canvas.getContext("2d");
    const background = await Canvas.loadImage(
      path.join(__dirname, "../../assets/background.jpg")
    );
    context.drawImage(background, 0, 0, canvas.width, canvas.height);


    context.fillStyle = getColorFromId(interaction.user.id);
    context.font = "32px " + font;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(interaction.user.username.toUpperCase(), 100, 8);

    context.fillStyle = "#FFFFFF";
    context.font = "16px " + font;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(userBio, 100, 38);
    
    context.fillStyle = "#FFFFFF";
    context.font = "20px " + font;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(userCoins.toString()+" 💵", 100, 64+32);

    context.fillStyle = "#FFFFFF";
    context.font = "20px " + font;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText("Niveau "+userLevel.toString(), 100, 64+64);

    

    const attachment = new AttachmentBuilder(await canvas.encode("png"), {
      name: "profile-image.png",
    });
    // Répondre à l'interaction avec l'embed
    await interaction.reply({ files: [attachment] });

    function getColorFromId(id) {
      // Obtenir les 4 derniers chiffres de l'ID (en s'assurant que l'ID est une chaîne)
      const lastFourDigits = id.slice(-4);
      // Convertir en nombre entier
      const seed = parseInt(lastFourDigits, 10);
      // Utiliser la seed pour générer une couleur
      const color = `hsl(${seed % 360}, 70%, 50%)`; // Utilisation de HSL pour des couleurs différentes
      return color;
    }
  },
};
