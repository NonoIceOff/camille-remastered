const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { getColorFromId } = require('../../colorUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('Affiche les 3 dernières actualités de Minecraft.net'),

    async execute(interaction) {
        const rssFeedUrl = 'https://fr-minecraft.net/minecraft_net_rss.xml';

        try {
            const response = await axios.get(rssFeedUrl);
            const xmlData = response.data;

            const parsedData = await parseStringPromise(xmlData, { explicitArray: false });

            if (!parsedData || !parsedData.feed || !parsedData.feed.entry) {
                throw new Error('Format de flux RSS invalide ou données manquantes.');
            }

            const entries = parsedData.feed.entry.slice(0, 3);
            const embeds = [];

            for (const [index, entry] of entries.entries()) {
                const title = entry.title._;
                const link = entry.link.$.href;
                let description = entry.content._;

                // Extract image URL from <img> tag in content
                const imageMatch = description.match(/<img[^>]*src="([^"]*)"[^>]*>/);

                // If image found in content, extract the URL
                var image = imageMatch ? imageMatch[1] : null;

                // Log image URL for debugging
                console.log(image);

                // Remove HTML tags from description
                description = description.replace(/<[^>]+>/g, '');

                const exampleEmbed = new EmbedBuilder()
                    .setTitle(`${title}`)
                    .setColor("#FFD700")
                    .setURL(`${link}`)
                    .setDescription(`${description}`)
                    .setThumbnail(`${image}`)
                    .setTimestamp(new Date(entry.published))
                    .setFooter({
                        text: 'Publié le',
                    })
                console.log(exampleEmbed)

                embeds.push(exampleEmbed);
            }

            await interaction.reply({ embeds });
        } catch (error) {
            console.error('Erreur lors de la récupération ou du traitement du flux RSS :', error);
            await interaction.reply('Une erreur est survenue lors de la récupération des informations de Minecraft.net.');
        }
    },
};
