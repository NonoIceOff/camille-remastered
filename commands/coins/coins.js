const fs = require('fs');
const { SlashCommandBuilder, userMention } = require('discord.js');
const { getUserInfos, modifyUser, changeUserInfos} = require("../../utils/user.js")

// Répertoire de stockage des statistiques
const statsDir = 'stats';

// Fonction pour charger les statistiques d'un utilisateur depuis un fichier
function loadUserStats(userId) {
    const userStatsFilePath = `${statsDir}/user_${userId}.json`;
    try {
        const statsFileContent = fs.readFileSync(userStatsFilePath, 'utf-8');
        return JSON.parse(statsFileContent);
    } catch (error) {
        console.error(`Erreur lors du chargement des statistiques du joueur ${userId}:`, error);
        return { coins: 0 };
    }
}

// Fonction pour sauvegarder les statistiques d'un utilisateur dans un fichier
function saveUserStats(userId, stats) {
    const userStatsFilePath = `${statsDir}/user_${userId}.json`;
    try {
        const jsonData = JSON.stringify(stats);
        fs.writeFileSync(userStatsFilePath, jsonData);
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde des statistiques du joueur ${userId}:`, error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coins')
        .setDescription('Gérer les coins d\'un utilisateur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajoute des coins à un utilisateur')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('L\'utilisateur à qui ajouter des coins')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('valeur')
                        .setDescription('Nombre de coins à ajouter')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retire des coins à un utilisateur')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('L\'utilisateur à qui retirer des coins')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('valeur')
                        .setDescription('Nombre de coins à retirer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Met à un nombre précis de coins pour un utilisateur')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('L\'utilisateur à qui mettre à un nombre précis de coins')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('valeur')
                        .setDescription('Nombre de coins à définir')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('multiply')
                .setDescription('Multiplie le nombre de coins d\'un utilisateur par un facteur')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('L\'utilisateur à multiplier les coins')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('facteur')
                        .setDescription('Facteur de multiplication')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('divide')
                .setDescription('Divise le nombre de coins d\'un utilisateur par un diviseur')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('L\'utilisateur à diviser les coins')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('diviseur')
                        .setDescription('Diviseur')
                        .setRequired(true))),

    async execute(interaction) {
        // Vérifier les permissions de l'utilisateur
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({ content: 'Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('utilisateur');
        const value = interaction.options.getInteger('valeur') || interaction.options.getInteger('facteur') || interaction.options.getInteger('diviseur');

        if (!user) {
            await interaction.reply({ content: 'Utilisateur non trouvé.', ephemeral: true });
            return;
        }

        let stats = loadUserStats(user.id);

        switch (subcommand) {
            case 'add':
                await changeUserInfos(interaction.user.id,value,"","",0,0,0)
                await interaction.reply({ content: `Coins ajoutés à ${user.displayName}: ${value}`});
                break;
            case 'remove':
                await changeUserInfos(interaction.user.id,-value,"","",0,0,0)
                await interaction.reply({ content: `Coins retirés à ${user.displayName}: ${value}`});
                break;
            case 'set':
                const userInfos = await getUserInfos(interaction.user.id);
                await modifyUser(interaction.user.id,value,userInfos.bio,userInfos.color,userInfos.voicetime,userInfos.amethyst,userInfos.messages)
                await interaction.reply({ content: `Nombre de coins défini pour ${user.displayName}: ${value}`});
                break;
            case 'multiply':
                const userInfos2 = await getUserInfos(interaction.user.id);
                await modifyUser(interaction.user.id,userInfos2.coins*value,userInfos2.bio,userInfos2.color,userInfos2.voicetime,userInfos2.amethyst,userInfos2.messages)
                await interaction.reply({ content: `Coins multipliés pour ${user.displayName}: ${value}`});
                break;
            case 'divide':
                if (value === 0) {
                    await interaction.reply({ content: 'Division par zéro impossible.', ephemeral: true });
                    return;
                }
                const userInfos3 = await getUserInfos(interaction.user.id);
                await modifyUser(interaction.user.id,userInfos3.coins/value,userInfos3.bio,userInfos3.color,userInfos3.voicetime,userInfos3.amethyst,userInfos3.messages)
                await interaction.reply({ content: `Coins divisés pour ${userMention(user.id)} par ${value}: ${stats.coins}` });
                break;
            default:
                await interaction.reply({ content: 'Sous-commande invalide.', ephemeral: true });
        }
    },
};
