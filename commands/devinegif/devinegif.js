const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devinegif')
        .setDescription('Devine le GIF'),

    async execute(interaction) {
        try {
            const apiKey = 'AIzaSyAddlx10qZlYboDITwhU-XRM1oOQ_fXzQU'; // Remplacez par votre propre clé API Google
            const query = 'excited';
            const limit = 8;

            const response = await axios.get(`https://tenor.googleapis.com/v2/search?q=${query}&key=${apiKey}&limit=${limit}`);

            if (response.data.results && response.data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * response.data.results.length);
                const randomGifUrl = response.data.results[randomIndex].media[0].gif.url;

                await interaction.reply(randomGifUrl);
            } else {
                await interaction.reply("Aucun GIF trouvé.");
            }
        } catch (error) {
            console.error(error);
            await interaction.reply("Une erreur s'est produite lors de la recherche du GIF.");
        }
    },
};
