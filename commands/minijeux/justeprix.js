const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('justeprix')
        .setDescription('Jouez au jeu du Juste Prix (devinez un nombre entre 1 et 100)'),
    
    async execute(interaction) {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        let attempts = 0;

        await interaction.reply('Devinez un nombre entre 1 et 100 !');

        const filter = m => !m.author.bot;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async message => {
            const userGuess = parseInt(message.content);

            if (isNaN(userGuess)) {
                await interaction.followUp('Veuillez entrer un nombre valide.');
                return;
            }

            attempts++;

            if (userGuess === randomNumber) {
                await interaction.followUp(`Bravo ! Vous avez deviné le nombre **${randomNumber}** en ${attempts} tentative(s).`);
                collector.stop();
            } else if (userGuess < randomNumber) {
                await interaction.followUp('Le nombre que vous avez deviné est trop bas.');
            } else {
                await interaction.followUp('Le nombre que vous avez deviné est trop élevé.');
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('Le jeu a expiré. Utilisez `/justeprix` pour recommencer.');
            }
        });
    },
};
