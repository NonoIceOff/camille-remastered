const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uno')
        .setDescription('Jouer en UNO contre un bot en message privé'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const filePath = path.join(__dirname, `../../stats/user_${userId}.json`);

        // Lire le fichier JSON de l'utilisateur
        if (!fs.existsSync(filePath)) {
            return interaction.reply({ content: "Vous n'avez pas de stats.", ephemeral: true });
        }

        const userData = JSON.parse(fs.readFileSync(filePath));

        // Embed pour afficher les rôles disponibles
        const embed = new EmbedBuilder()
            .setTitle('UNO')
            .setColor("#FFD700")
            .setDescription(`Jouez en UNO contre un bot en message privé. *Vous avez ${userData.coins} :dollar:.*`);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('uno_start')
                    .setLabel('Démarrer une partie')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'uno_start') {
                // Démarrer une partie de UNO
                const unoData = {
                    players: [interaction.user.id, 'bot'],
                    current: 0,
                    direction: 1,
                    deck: [],
                    hands: {
                        [interaction.user.id]: [],
                        'bot': [],
                    },
                    discard: [],
                };

                // Créer un paquet de cartes
                const colors = ['red', 'yellow', 'green', 'blue'];
                const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
                const wilds = ['wild', 'draw4'];
                

            }
        });
    }
};
