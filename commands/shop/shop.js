const { SlashCommandBuilder } = require('discord.js');
const { fishList, treasureList } = require('../peche/items');
const { EmbedBuilder } = require('discord.js');

const shopCommand = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Affiche les articles disponibles dans le magasin.');

module.exports = {
    data: shopCommand,
    async execute(interaction) {
        // Diviser les articles en poissons et trésors
        const fishes = fishList.map(item => ({ name: `${item.emoji} ${item.name}`, price: item.price }));
        const treasures = treasureList.map(item => ({ name: `${item.emoji} ${item.name}`, price: item.price }));

        // Diviser les poissons et les trésors en pages de 25 articles maximum
        const fishPages = [];
        while (fishes.length > 0) {
            fishPages.push(fishes.splice(0, 25));
        }

        const treasurePages = [];
        while (treasures.length > 0) {
            treasurePages.push(treasures.splice(0, 25));
        }

        // Construire les embeds pour chaque page de poissons
        const fishEmbeds = [];
        for (const fishPage of fishPages) {
            const fishEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Poissons')
                .setDescription('Voici les poissons disponibles dans le magasin :');

            fishPage.forEach(item => {
                fishEmbed.addFields(
                    { name: item.name, value: `Prix : ${item.price} pièces d'or`, inline: true }
                );
            });

            fishEmbeds.push(fishEmbed);
        }

        // Construire les embeds pour chaque page de trésors
        const treasureEmbeds = [];
        for (const treasurePage of treasurePages) {
            const treasureEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('Trésors')
                .setDescription('Voici les trésors disponibles dans le magasin :');

            treasurePage.forEach(item => {
                treasureEmbed.addFields(
                    { name: item.name, value: `Prix : ${item.price} pièces d'or`, inline: true }
                );
            });

            treasureEmbeds.push(treasureEmbed);
        }

        // Envoyer tous les embeds dans une seule réponse
        await interaction.reply({ embeds: [...fishEmbeds, ...treasureEmbeds] });
    },
};
