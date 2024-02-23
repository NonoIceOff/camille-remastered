const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sondage')
        .setDescription('Crée un sondage')
        .addStringOption(option => option.setName('question').setDescription('La question du sondage').setRequired(true))
        .addStringOption(option => option.setName('choix1').setDescription('Premier choix du sondage').setRequired(true))
        .addStringOption(option => option.setName('choix2').setDescription('Deuxième choix du sondage').setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const choix1 = interaction.options.getString('choix1');
        const choix2 = interaction.options.getString('choix2');

        const embed = {
            color: 0x3498db,
            title: 'Sondage',
            description: question,
            fields: [
                { name: 'Choix 1', value: choix1, inline: true },
                { name: 'Choix 2', value: choix2, inline: true },
            ],
            footer: { text: `Sondage créé par ${interaction.user.tag}` },
        };

        const sentMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

        await sentMessage.react('1️⃣');
        await sentMessage.react('2️⃣');
    },
};
