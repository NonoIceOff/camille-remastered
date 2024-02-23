const { SlashCommandBuilder } = require('discord.js');
const { GetChar } = require('anime-character-random');
const fs = require('fs');

const inventoryFile = 'inventory.json';

function readInventory() {
  try {
    const data = fs.readFileSync(inventoryFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'inventaire :', error);
    return {};
  }
}

function writeInventory(inventory) {
  try {
    fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2), 'utf8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture de l\'inventaire :', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dropcarte')
    .setDescription('Obtenez une carte d\'anime aléatoire et ajoutez-la à votre inventaire.'),
  async execute(interaction) {
    const user = interaction.user;
    try {
      const AnimeData = await GetChar();

      // Lire l'inventaire actuel
      const inventoryData = readInventory();

      if (!inventoryData.inventory) {
        inventoryData.inventory = {};
      }

      if (!inventoryData.inventory[user.id]) {
        inventoryData.inventory[user.id] = { poissons: {}, cartes: {} };
      }

      // Ajouter la carte à l'inventaire
      const userInventory = inventoryData.inventory[user.id];
      const cardName = AnimeData.CharacterName;
      const cardImage = AnimeData.CharacterImage;

      if (!userInventory.cartes[cardName]) {
        userInventory.cartes[cardName] = 1;
      } else {
        userInventory.cartes[cardName]++;
      }

      // Enregistrer les modifications dans le fichier inventory.json
      writeInventory(inventoryData);

      const cardEmbed = {
        title: `Vous avez obtenu une carte d'anime : ${cardName}`,
        color: 0x9400D3, // Violet
        fields: [
          {
            name: 'Anime',
            value: AnimeData.AnimeName,
          },
          {
            name: 'Nom du personnage',
            value: cardName,
          },
          {
            name: 'Nom japonais du personnage',
            value: AnimeData.CharacterJapaneseName,
          },
        ],
        image: { url: cardImage },
      };

      await interaction.reply({ embeds: [cardEmbed] });
    } catch (error) {
      console.error('Erreur lors de la récupération du personnage d\'anime :', error);
      await interaction.reply('Désolé, une erreur s\'est produite lors de la récupération du personnage d\'anime aléatoire.');
    }
  },
};
