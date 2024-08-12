const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// Définition des URLs de flux RSS pour chaque thématique de Franceinfo
const rssFeeds = {
    'LES TITRES': 'https://www.francetvinfo.fr/titres.rss',
    'FRANCE': 'https://www.francetvinfo.fr/france.rss',
    'Politique': 'https://www.francetvinfo.fr/politique.rss',
    'Société': 'https://www.francetvinfo.fr/societe.rss',
    'Faits divers': 'https://www.francetvinfo.fr/faits-divers.rss',
    'Justice': 'https://www.francetvinfo.fr/justice.rss',
    'MONDE': 'https://www.francetvinfo.fr/monde.rss',
    'Europe': 'https://www.francetvinfo.fr/europe.rss',
    'Environnement': 'https://www.francetvinfo.fr/environnement.rss',
    'ECO': 'https://www.francetvinfo.fr/economie.rss',
    'Tendances': 'https://www.francetvinfo.fr/tendances.rss',
    'Entreprises': 'https://www.francetvinfo.fr/entreprises.rss',
    'Marchés': 'https://www.francetvinfo.fr/marches.rss',
    'Immobilier': 'https://www.francetvinfo.fr/immobilier.rss',
    'SPORTS': 'https://www.francetvinfo.fr/sports.rss',
    'F1': 'https://www.francetvinfo.fr/sports/f1.rss',
    'DÉCOUVERTES': 'https://www.francetvinfo.fr/decouvertes.rss',
    'Sciences': 'https://www.francetvinfo.fr/sciences.rss',
    'Santé': 'https://www.francetvinfo.fr/sante.rss',
    'Animaux': 'https://www.francetvinfo.fr/animaux.rss',
    'Médias': 'https://www.francetvinfo.fr/culture/medias.rss',
    'Cinéma': 'https://www.francetvinfo.fr/culture/cinema.rss',
    'Musique': 'https://www.francetvinfo.fr/culture/musique.rss',
    'Expos': 'https://www.francetvinfo.fr/culture/expos.rss',
    'Internet': 'https://www.francetvinfo.fr/culture/internet.rss',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infos')
        .setDescription('Affiche les 3 premières infos de Franceinfo')
        .addStringOption(option =>
            option.setName('thematique')
                .setDescription('Choisissez la thématique')
                .setRequired(true)
                .addChoices(Object.entries(rssFeeds).map(([name, url]) => ({ name, value: url })))),
    
    async execute(interaction) {
        const thematicUrl = interaction.options.getString('thematique');

        try {
            const response = await axios.get(thematicUrl);
            const xmlData = response.data;

            const parsedData = await parseStringPromise(xmlData);

            if (!parsedData || !parsedData.rss || !parsedData.rss.channel || !parsedData.rss.channel[0].item) {
                throw new Error('Format de flux RSS invalide ou données manquantes.');
            }

            const items = parsedData.rss.channel[0].item.slice(0, 3);
            const embeds = [];

            for (const item of items) {
                const title = item.title[0];
                console.log(title)
                const link = item.link[0];
                let description = item.description ? item.description[0] : 'Description non disponible';
                const pubDate = new Date(item.pubDate[0]);

                // Extract image URL from enclosure
                const image = item.enclosure ? item.enclosure[0].$.url : null;

                // Création de l'embed avec l'image
                const exampleEmbed = {
                    title: title.length > 100 ? `${title.slice(0, 100)}...` : title,
                    url: link,
                    thumbnail: image ? { url: image } : null,
                    description: `*${description}*`,
                    timestamp: pubDate,
                    footer: {
                        text: 'Publié le',
                    },
                };

                console.log(image);
                embeds.push(exampleEmbed);
            }

            // Envoyer les embeds à l'utilisateur
            await interaction.reply({ embeds });
        } catch (error) {
            console.error('Erreur lors de la récupération ou du traitement du flux RSS :', error);
            await interaction.reply('Une erreur est survenue lors de la récupération des informations de Franceinfo.');
        }
    },
};
