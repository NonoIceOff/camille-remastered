const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require("canvas");

// Assurez-vous de spécifier le chemin correct vers la police Poppins
registerFont('Poppins-Medium.ttf', { family: 'Poppins' });

const shopFile = "shop.json";

function readShop() {
  try {
    const data = fs.readFileSync(shopFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erreur lors de la lecture du shop :", error);
    return {};
  }
}

async function generateShopImage(coinsNumber, shopData, rarityNames, client) {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  // Dessiner le fond
  ctx.fillStyle = '#2C2F33';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner le titre
  ctx.fillStyle = '#ffffff';
  ctx.font = '30px Poppins, sans-serif'; // Utilisation de la police Poppins
  ctx.fillText('Shop', 10, 40);

  // Dessiner les détails du shop
  let yOffset = 80; // Décalage vertical initial pour les articles du shop

  for (const itemName in shopData) {
    const item = shopData[itemName];
    const name = itemName;
    const price = item["price"];
    const description = item["description"];
    const emojiURL = item["emoji"]; // Utilisez l'URL de l'emoji personnalisé
    const rarity = item["rare"];

    // Charger l'image de l'emoji personnalisé depuis l'URL
    const emojiImage = await loadImage(emojiURL).catch(err => {
      console.error(`Erreur lors du chargement de l'emoji ${name} depuis l'URL ${emojiURL}:`, err);
      return null;
    });

    if (emojiImage) {
      // Dessiner chaque article
      const itemImageSize = 50; // Ajustez cette valeur pour changer la taille de l'image
      ctx.drawImage(emojiImage, 10, yOffset, itemImageSize, itemImageSize);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Poppins, sans-serif'; // Utilisation de la police Poppins
      ctx.fillText(`${name} (${rarityNames[rarity - 1]})`, 80, yOffset + 30);

      ctx.fillStyle = '#ffd700'; // Couleur Gold
      ctx.font = '16px Poppins, sans-serif'; // Utilisation de la police Poppins
      ctx.fillText(`Prix: ${price} :coin:`, 80, yOffset + 60);

      ctx.fillStyle = '#cccccc';
      ctx.font = 'italic 14px Poppins, sans-serif'; // Utilisation de la police Poppins
      ctx.fillText(`${description}`, 80, yOffset + 80);

      yOffset += 120; // Ajuster le décalage vertical pour le prochain article
    }
  }

  // Dessiner le nombre de coins
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Poppins, sans-serif'; // Utilisation de la police Poppins
  ctx.fillText(`Vous avez ${coinsNumber} :coin:`, 10, canvas.height - 30);

  // Enregistrer l'image dans un fichier (facultatif)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('shop.png', buffer);

  // Renvoyer l'image sous forme de buffer
  return buffer;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription(
      "Affiche le shop et vous permettra d'acheter des items à l'aide de vos :coin:"
    ),
  async execute(interaction) {
    const client = interaction.client;
    const shopData = readShop();

    const rawdata = fs.readFileSync("stats/coins.json");
    const coins = JSON.parse(rawdata);
    const coinsNumber = coins[interaction.user.id].toString();

    const rarityNames = ["Commun", "Non commun", "Rare", "Epique", "Unique"];

    // Crée l'image avec tous les items
    const shopImageBuffer = await generateShopImage(
      coinsNumber,
      shopData,
      rarityNames,
      client
    );

    // Envoie l'image à l'utilisateur
    await interaction.reply({ files: [shopImageBuffer] });
  },
};
