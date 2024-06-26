const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const { fishList, treasureList } = require('../peche/items.js');

const vendreCommand = new SlashCommandBuilder()
    .setName('vendre')
    .setDescription('Vendez tous les articles d\'une rareté spécifique ou tous les articles de votre inventaire.')
    .addStringOption(option =>
        option.setName('rarity')
            .setDescription('Rareté des articles à vendre (laissez vide pour tout vendre)')
            .setRequired(false)
            .addChoices(
                { name: 'commun', value: 'commun' },
                { name: 'peu commun', value: 'peu commun' },
                { name: 'rare', value: 'rare' },
                { name: 'très rare', value: 'très rare' }
            ));

module.exports = {
    data: vendreCommand,
    async execute(interaction) {
        const userId = interaction.user.id;
        const rarityToSell = interaction.options.getString('rarity');

        let inventory;
        try {
            const inventoryFileContent = fs.readFileSync(`inventory/user_${userId}.json`, 'utf-8');
            inventory = JSON.parse(inventoryFileContent);
        } catch (error) {
            console.error(`Erreur lors du chargement de l'inventaire du joueur ${userId}:`, error);
            await interaction.reply("Erreur lors du chargement de votre inventaire.");
            return;
        }

        if (!inventory.items || inventory.items.length === 0) {
            await interaction.reply("Votre inventaire est vide.");
            return;
        }

        const shopItems = [...fishList, ...treasureList];
        let itemsToSell;

        if (rarityToSell) {
            itemsToSell = inventory.items.filter(item => {
                const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
                return shopItem && shopItem.rarity === rarityToSell;
            });

            if (itemsToSell.length === 0) {
                await interaction.reply(`Aucun article de rareté "${rarityToSell}" trouvé dans votre inventaire.`);
                return;
            }
        } else {
            itemsToSell = inventory.items;
        }

        let totalValue = 0;
        itemsToSell.forEach(item => {
            const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
            totalValue += shopItem.price * item.quantity;
        });

        if (rarityToSell) {
            inventory.items = inventory.items.filter(item => {
                const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
                return !(shopItem && shopItem.rarity === rarityToSell);
            });
        } else {
            inventory.items = [];
        }

        try {
            fs.writeFileSync(`inventory/user_${userId}.json`, JSON.stringify(inventory, null, 4), 'utf-8');
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'inventaire du joueur ${userId}:`, error);
            await interaction.reply("Erreur lors de la mise à jour de votre inventaire.");
            return;
        }

        let stats;
        try {
            const statsFileContent = fs.readFileSync(`stats/user_${userId}.json`, 'utf-8');
            stats = JSON.parse(statsFileContent);
        } catch (error) {
            console.error(`Erreur lors du chargement des statistiques du joueur ${userId}:`, error);
            await interaction.reply("Erreur lors du chargement de vos statistiques.");
            return;
        }

        stats.coins = (stats.coins || 0) + totalValue;

        try {
            fs.writeFileSync(`stats/user_${userId}.json`, JSON.stringify(stats, null, 4), 'utf-8');
        } catch (error) {
            console.error(`Erreur lors de la mise à jour des statistiques du joueur ${userId}:`, error);
            await interaction.reply("Erreur lors de la mise à jour de vos statistiques.");
            return;
        }

        await interaction.reply(`Vous avez vendu ${rarityToSell ? `tous les articles de rareté "${rarityToSell}"` : 'tous vos articles'} pour un total de ${totalValue} 💵.`);
    },
};
