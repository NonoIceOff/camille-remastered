const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { fishList, treasureList } = require('../peche/items.js');

const buyCommand = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achetez un article dans le magasin.')
    .addStringOption(option =>
        option.setName('article')
            .setDescription('Nom de l\'article à acheter.')
            .setRequired(true));

module.exports = {
    data: buyCommand,
    async execute(interaction) {
        const userId = interaction.user.id;
        const articleToBuy = interaction.options.getString('article');

        let stats = {};
        try {
            const statsFileContent = fs.readFileSync(`stats/user_${userId}.json`, 'utf-8');
            stats = JSON.parse(statsFileContent);
        } catch (error) {
            console.error(`Erreur lors du chargement des statistiques du joueur ${userId}:`, error);
        }

        // Fusionner les poissons et les trésors pour les articles disponibles dans le magasin
        const shopItems = [...fishList, ...treasureList].map(item => ({ name: item.name, emoji: item.emoji, price: item.price }));

        const selectedItem = shopItems.find(item => item.name.toLowerCase() === articleToBuy.toLowerCase());
        if (!selectedItem) {
            await interaction.reply(`L'article "${articleToBuy}" n'est pas disponible dans le magasin.`);
            return;
        }

        const userCoins = stats.coins || 0;
        if (userCoins < selectedItem.price) {
            await interaction.reply(`Vous n'avez pas assez de pièces d'or pour acheter "${articleToBuy}".`);
            return;
        }

        stats.coins -= selectedItem.price;

        let inventory = {};
        try {
            const inventoryFileContent = fs.readFileSync(`inventory/user_${userId}.json`, 'utf-8');
            inventory = JSON.parse(inventoryFileContent);
        } catch (error) {
            console.error(`Erreur lors du chargement de l'inventaire du joueur ${userId}:`, error);
        }

        if (!inventory.items) {
            inventory.items = [];
        }
        const existingItemIndex = inventory.items.findIndex(item => item.name === articleToBuy);
        if (existingItemIndex !== -1) {
            inventory.items[existingItemIndex].quantity++;
        } else {
            inventory.items.push({ name: articleToBuy, emoji: selectedItem.emoji, quantity: 1 });
        }

        fs.writeFileSync(`inventory/user_${userId}.json`, JSON.stringify(inventory, null, 4), 'utf-8');

        fs.writeFileSync(`stats/user_${userId}.json`, JSON.stringify(stats, null, 4), 'utf-8');

        await interaction.reply(`Vous avez acheté "${articleToBuy}" ${selectedItem.emoji} pour ${selectedItem.price} pièces d'or.`);
    },
};
