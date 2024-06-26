const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const Canvas = require("@napi-rs/canvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("classement")
    .setDescription(
      "Affiche le classement des membres selon le nombre de 💵"
    ),

  async execute(interaction, client) {
    const statsDirectory = path.join(__dirname, "../../stats");
    let userStatsList = [];

    // Lire tous les fichiers de stats
    fs.readdirSync(statsDirectory).forEach((file) => {
      if (file.endsWith(".json")) {
        const filePath = path.join(statsDirectory, file);
        try {
          const userStatsFileContent = fs.readFileSync(filePath, "utf-8");
          const userStats = JSON.parse(userStatsFileContent);
          const userId = path.basename(file, ".json").split("_")[1];
          userStatsList.push({ userId, ...userStats });
        } catch (error) {
          console.error(
            `Erreur lors de la lecture du fichier ${filePath} :`,
            error
          );
        }
      }
    });

    // Trier les utilisateurs par nombre de coins
    userStatsList.sort((a, b) => (b.coins || 0) - (a.coins || 0));

    const font = "Poppins"
    const canvas = Canvas.createCanvas(800, 400); // Augmenter la taille du canvas pour plus de place
    const context = canvas.getContext("2d");
    const background = await Canvas.loadImage(path.join(__dirname, "../../assets/background.jpg"));
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Définir les propriétés du texte pour le classement
    context.font = "36px "+font;
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";

    // Dessiner le titre du classement
    context.fillText("Classement des membres par 💵", canvas.width / 2, 50);

    const boxWidth = 150; // Largeur fixe des cases
    const boxHeight = 100; // Hauteur fixe des cases
    const padding = 20; // Espacement entre les cases
    const startX = 50; // Position de départ x
    const startY = 100; // Position de départ y (sous le titre)

    // Couleurs pour les cases
    const colors = [
      "#FF6F61",
      "#6B5B95",
      "#88B04B",
      "#F7CAC9",
      "#92A8D1",
      "#955251",
      "#B565A7",
      "#009B77",
      "#DD4124",
      "#D65076",
    ];

    for (let index = 0; index < Math.min(userStatsList.length, 10); index++) {
      let userStats = userStatsList[index];
      let user = await client.users.fetch(userStats.userId);
      let username = user.username.toUpperCase();
      console.log(username);

      // Calculer les coordonnées x et y pour positionner les cases en grille
      let x = startX + (index % 5) * (boxWidth + padding); // 5 cases par ligne
      let y = startY + Math.floor(index / 5) * (boxHeight + padding);

      // Dessiner le rectangle de fond de la case avec des coins arrondis
      context.fillStyle = colors[index]; // Couleur de fond de la case
      context.beginPath();
      context.moveTo(x + 15, y);
      context.lineTo(x + boxWidth - 15, y);
      context.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + 15);
      context.lineTo(x + boxWidth, y + boxHeight - 15);
      context.quadraticCurveTo(
        x + boxWidth,
        y + boxHeight,
        x + boxWidth - 15,
        y + boxHeight
      );
      context.lineTo(x + 15, y + boxHeight);
      context.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - 15);
      context.lineTo(x, y + 15);
      context.quadraticCurveTo(x, y, x + 15, y);
      context.closePath();
      context.fill();


      // Couleur plus claire pour le texte de la place
      let lighterColor = lightenColor(colors[index], 5); // Fonction pour éclaircir la couleur

      // Ajouter le texte de la place en arrière-plan
      context.fillStyle = lighterColor;
      context.font = `${boxWidth / 2}px ${font}`; // Taille du texte qui prend toute la place
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`#${index + 1}`, x + boxWidth / 2, y + boxHeight / 2);

      // Ajouter une ombre aux cases
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 10;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 5;

      // Définir les propriétés du texte pour le pseudo
      context.fillStyle = "#FFFFFF";
      context.font = "20px "+font;
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillText(username, x + boxWidth / 2, y + 10);

      // Définir les propriétés du texte pour le nombre de coins
      context.font = "18px "+font;
      context.textBaseline = "bottom";
      context.fillText(
        `${userStats.coins || 0} 💵`,
        x + boxWidth / 2,
        y + boxHeight - 10
      );

      // Réinitialiser les ombres après avoir dessiné chaque case
      context.shadowColor = "transparent";
    }

    const attachment = new AttachmentBuilder(await canvas.encode("png"), {
      name: "profile-image.png",
    });
    interaction.reply({ files: [attachment] });

    function lightenColor(color, percent) {
      let num = parseInt(color.slice(1), 16); // Convertir en nombre hexadécimal
      let amt = Math.round(2.55 * percent); // Calculer l'augmentation en RVB
      let r = (num >> 16) + amt; // Augmenter le rouge
      let b = ((num >> 8) & 0x00FF) + amt; // Augmenter le bleu
      let g = (num & 0x0000FF) + amt; // Augmenter le vert
      r = Math.min(Math.max(r, 0), 255); // S'assurer que les valeurs sont entre 0 et 255
      b = Math.min(Math.max(b, 0), 255);
      g = Math.min(Math.max(g, 0), 255);
      return `#${(g | (b << 8) | (r << 16)).toString(16)}`; // Retourner la couleur en format hexadécimal
    }
  },
};

