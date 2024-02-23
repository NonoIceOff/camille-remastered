const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// Liste des poissons avec leurs probabilités de rareté
const fishList = [
  { name: '🐟 Poisson rouge', rarity: 10 },
  { name: '🐡 Poisson-globe', rarity: 5 },
  { name: '🦑 Calmar', rarity: 7 },
  { name: '🐙 Pieuvre', rarity: 5 },
  { name: '🦐 Crevette', rarity: 10 },
  { name: '🦞 Homard', rarity: 8 },
  { name: '🦀 Crabe', rarity: 9 },
  { name: '🐠 Poisson-clown', rarity: 6 },
  { name: '🐡 Poisson-globe', rarity: 5 },
  { name: '🐟 Poisson-lion', rarity: 4 },
  { name: '🐬 Dauphin', rarity: 3 },
  { name: '🐋 Baleine', rarity: 2 },
  { name: '🐢 Tortue de mer', rarity: 8 },
  { name: '🐚 Coquillage', rarity: 12 },
  { name: '🐧 Manchot', rarity: 5 },
  { name: '🐦 Oiseau de mer', rarity: 6 },
  { name: '🦆 Canard', rarity: 5 },
  { name: '🦢 Cygne', rarity: 4 },
  { name: '🦉 Hibou de mer', rarity: 3 },
  { name: '🐸 Grenouille', rarity: 7 },
  { name: '🐍 Serpent de mer', rarity: 4 },
  { name: '🦎 Lézard de mer', rarity: 3 },
  { name: '🐊 Crocodile de mer', rarity: 2 },
  { name: '🐋 Requin', rarity: 1 },
  { name: '🐋 Requin-baleine', rarity: 1 },
];

const inventoryFile = 'inventory.json';

function readInventory() {
  try {
    const data = fs.readFileSync(inventoryFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'inventaire :', error);
    return { inventory: {} };
  }
}

function writeInventory(inventory) {
  try {
    const data = JSON.stringify(inventory, null, 2);
    fs.writeFileSync(inventoryFile, data, 'utf8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture de l\'inventaire :', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('Pêchez un poisson !'),
  async execute(interaction) {
    await interaction.deferReply(); // Réponse différée

    // Simuler une animation d'attente
    const animationFrames = ['🎣 Attendez...', '🎣 Attendez...🐟', '🎣 Attendez...🐟🎣', '🎣 Attendez...🐟🎣🐡'];
    let frameIndex = 0;

    const waitingMessage = await interaction.editReply(animationFrames[frameIndex]);

    const animationInterval = setInterval(async () => {
      frameIndex = (frameIndex + 1) % animationFrames.length;
      await waitingMessage.edit(animationFrames[frameIndex]);
    }, 1000); // Change l'animation toutes les 1 seconde (1000 millisecondes)

    // Simuler un temps d'attente (par exemple, 5 secondes) avant de donner le résultat de la pêche
    setTimeout(async () => {
      clearInterval(animationInterval); // Arrête l'animation

      // Générez un nombre aléatoire entre 1 et 100
      const randomNum = Math.random() * 100;

      // Initialisez un poisson aléatoire comme nul
      let randomFish = null;

      // Parcourez la liste des poissons pour déterminer celui qui a été pêché
      let cumulativeProbability = 0;
      for (const fish of fishList) {
        cumulativeProbability += fish.rarity;
        if (randomNum <= cumulativeProbability) {
          randomFish = fish.name;
          break;
        }
      }

      if (randomFish) {
        const user = interaction.user;
        const inventoryData = readInventory();

        // Créez un inventaire vide pour l'utilisateur s'il n'en a pas encore
        if (!inventoryData.inventory[user.id]) {
          inventoryData.inventory[user.id] = {
            poissons: {},
            cartes: {},
          };
        }

        const userInventory = inventoryData.inventory[user.id];

        // Ajoutez le poisson pêché à l'inventaire de l'utilisateur
        if (!userInventory.poissons[randomFish]) {
          userInventory.poissons[randomFish] = 0;
        }
        userInventory.poissons[randomFish] += 1;

        // Sauvegardez l'inventaire mis à jour dans le fichier JSON
        writeInventory(inventoryData);

        await interaction.editReply(`Vous avez attrapé : ${randomFish}`);
      } else {
        await interaction.editReply('Aucun poisson n\'a été attrapé.');
      }
    }, 5000); // Délai de 5 secondes (5000 millisecondes) avant d'afficher le résultat
  },
};
