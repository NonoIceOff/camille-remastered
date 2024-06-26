const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const Canvas = require("@napi-rs/canvas");

// Définir l'offset pour le graphique
const offsetX = 50;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("graphique")
    .setDescription(
      "Affiche le nombre de 💵 collectés par jour et par utilisateur"
    ),

  async execute(interaction, client) {
    const logDirectory = path.join(__dirname, "../../logs");
    let coinData = {};

    try {
      const logFiles = fs
        .readdirSync(logDirectory)
        .filter((file) => file.endsWith(".json"));

      for (const file of logFiles) {
        const filePath = path.join(logDirectory, file);
        const logFileContent = fs.readFileSync(filePath, "utf-8");
        const logs = JSON.parse(logFileContent);

        const [_, dateString] = path.basename(file, ".json").split("_");
        const [year, month, day] = dateString.split("-");

        logs.forEach((log) => {
          const { userId, coins } = log;
          if (!coinData[dateString]) {
            coinData[dateString] = {};
          }
          if (!coinData[dateString][userId]) {
            coinData[dateString][userId] = 0;
          }
          coinData[dateString][userId] += coins || 0;
        });
      }

      const graphData = {
        labels: [],
        usernames: [],
        datasets: [],
      };

      // Trouver la plus petite valeur de coins
      let minCoins = Infinity;
      for (const userCoins of Object.values(coinData)) {
        for (const coins of Object.values(userCoins)) {
          if (coins < minCoins) {
            minCoins = coins;
          }
        }
      }

      for (const [dateString, userCoins] of Object.entries(coinData)) {
        const [year, month, day] = dateString.split("-");
        for (const [userId, coins] of Object.entries(userCoins)) {
          const username = await getUsername(userId);

          if (!graphData.labels.includes(dateString)) {
            graphData.labels.push(dateString);
          }
          if (!graphData.usernames.includes(username)) {
            graphData.usernames.push(username);
          }
          const dateIndex = graphData.labels.indexOf(dateString);
          const userIndex = graphData.usernames.indexOf(username);
          if (!graphData.datasets[userIndex]) {
            const randomColor = getColorFromId(userId);
            graphData.datasets[userIndex] = {
              label: username,
              data: Array(graphData.labels.length).fill(null),
              borderColor: randomColor,
              fill: false,
              tension: 0.2,
            };
          }
          graphData.datasets[userIndex].data[dateIndex] = coins;
        }
      }

      let maxCoins = -Infinity;
      graphData.datasets.forEach((dataset) => {
        const datasetMax = Math.max(
          ...dataset.data.filter((value) => value !== null)
        );
        if (datasetMax > maxCoins) {
          maxCoins = datasetMax;
        }
      });

      const canvasWidth = 1200;
      const canvasHeight = 700;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");

      const background = await Canvas.loadImage(
        path.join(__dirname, "../../assets/background.jpg")
      );
      context.drawImage(background, 0, 0, canvas.width, canvas.height);

      const font = "Poppins";
      context.font = `16px ${font}`;

      context.fillStyle = "#FFFFFF";
      context.textAlign = "center";
      context.fillText(
        "Évolution des 💵 collectés par jour et par utilisateur",
        canvasWidth / 2,
        30
      );

      const padding = 50;
      const chartWidth = canvasWidth * 0.8 - 2 * padding;
      const chartHeight = canvasHeight - 2 * padding;

      context.beginPath();
      context.moveTo(padding + offsetX, canvasHeight - padding);
      context.lineTo(padding + offsetX + chartWidth, canvasHeight - padding);
      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 2;
      context.stroke();

      context.beginPath();
      context.moveTo(padding + offsetX, padding);
      context.lineTo(padding + offsetX, canvasHeight - padding);
      context.stroke();

      const numGraduations = 5;
      const graduationStep = (maxCoins - minCoins) / (numGraduations - 1);
      context.textAlign = "right";
      for (let i = 0; i < numGraduations; i++) {
        const graduationValue = minCoins + i * graduationStep;
        const y =
          canvasHeight -
          padding -
          ((graduationValue - minCoins) / (maxCoins - minCoins)) * chartHeight;
        context.beginPath();
        context.moveTo(padding + offsetX - 5, y);
        context.lineTo(padding + offsetX + 5, y);
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 1;
        context.stroke();
        context.fillText(
          graduationValue.toFixed(0),
          padding + offsetX - 10,
          y + 5
        );
      }

      context.textAlign = "center";
      graphData.labels.forEach((dateString, index) => {
        const x =
          padding +
          offsetX +
          (index / (graphData.labels.length - 1)) * chartWidth;
        context.beginPath();
        context.moveTo(x, canvasHeight - padding + 5);
        context.lineTo(x, canvasHeight - padding - 5);
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 1;
        context.stroke();
        context.fillText(dateString, x, canvasHeight - 10);
      });

      context.textAlign = "left";
      context.font = `14px ${font}`;
      const legendWidth = canvasWidth * 0.2;
      const legendPadding = 10;
      const legendX = canvasWidth - legendWidth + offsetX + legendPadding;
      graphData.datasets.forEach((dataset, index) => {
        context.fillStyle = dataset.borderColor;
        const lastDataPoint = dataset.data[dataset.data.length - 1];
        if (lastDataPoint !== null) {
          const y = padding + index * (chartHeight / graphData.datasets.length);
          context.beginPath();
          context.arc(legendX + 7.5, y, 7.5, 0, Math.PI * 2);
          context.fillStyle = dataset.borderColor;
          context.fill();

          context.fillStyle = "#FFFFFF";
          context.fillText(dataset.label, legendX + 20, y + 5);
        }
      });

      graphData.datasets.forEach((dataset) => {
        context.beginPath();
        context.lineWidth = 5;
        context.strokeStyle = dataset.borderColor;

        dataset.data.forEach((coins, dateIndex) => {
          if (coins !== null) {
            const x =
              padding +
              offsetX +
              (dateIndex / (graphData.labels.length - 1)) * chartWidth;
            const y =
              canvasHeight -
              padding -
              ((coins - minCoins) / (maxCoins - minCoins)) * chartHeight;

            context.beginPath();
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.fillStyle = dataset.borderColor;
            context.fill();
          }
        });

        context.moveTo(
          padding + offsetX,
          canvasHeight -
            padding -
            ((dataset.data[0] - minCoins) / (maxCoins - minCoins)) * chartHeight
        );
        dataset.data.forEach((coins, dateIndex) => {
          if (coins !== null) {
            const x =
              padding +
              offsetX +
              (dateIndex / (graphData.labels.length - 1)) * chartWidth;
            const y =
              canvasHeight -
              padding -
              ((coins - minCoins) / (maxCoins - minCoins)) * chartHeight;

            context.lineTo(x, y);
          }
        });

        context.stroke();
      });

      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "coin-graph.png",
      });

      await interaction.reply({ files: [attachment] });
    } catch (error) {
      console.error("Erreur lors de la lecture des fichiers de logs :", error);
      await interaction.reply(
        "Une erreur est survenue lors de la génération du graphique."
      );
    }

    async function getUsername(userId) {
      let user = await client.users.fetch(userId);
      return user.username;
    }

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
