const { SlashCommandBuilder } = require('discord.js');

const secretCommand = new SlashCommandBuilder()
    .setName('secret')
    .setDescription('Envoyer un message privé anonyme à un utilisateur.')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('L\'utilisateur à qui vous voulez envoyer un message.')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('message')
            .setDescription('Le message à envoyer.')
            .setRequired(true));

module.exports = {
    data: secretCommand,
    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur');
        const message = interaction.options.getString('message');

        if (!user) {
            await interaction.reply({ content: 'Utilisateur non trouvé.', ephemeral: true });
            return;
        }

        try {
            await console.log("Message secret :",message)
            await user.send(`**Vous avez reçu un message anonyme :**\n> ${message}\n\n*Inutile de répondre, je ne récupère pas les messages ici*`);
            await interaction.reply({ content: 'Message envoyé avec succès.', ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message privé :', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'envoi du message.', ephemeral: true });
        }
    },
};
