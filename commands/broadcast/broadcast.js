const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Chemin du fichier de stockage des utilisations
const storageDirectory = path.join(__dirname, '../../MONTHLY_USAGE');
const storageFilePath = path.join(storageDirectory, 'usage_data.json');

// Créer le répertoire MONTHLY_USAGE s'il n'existe pas
if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory, { recursive: true });
}

// Charger les données d'utilisation depuis le fichier
let usageData = loadUsageData();

// Fonction pour charger les données depuis le fichier
function loadUsageData() {
    try {
        // Vérifier si le fichier existe
        if (!fs.existsSync(storageFilePath)) {
            // Si le fichier n'existe pas, créer un nouveau fichier avec une structure JSON vide
            fs.writeFileSync(storageFilePath, JSON.stringify({}));
        }
        const data = fs.readFileSync(storageFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des données de stockage :', error);
        return {};
    }
}

// Fonction pour sauvegarder les données dans le fichier
function saveUsageData() {
    try {
        const jsonData = JSON.stringify(usageData);
        fs.writeFileSync(storageFilePath, jsonData);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données de stockage :', error);
    }
}

// Commande slash pour broadcast avec gestion d'utilisation
const broadcastCommand = new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('Envoyer un message privé à tous les membres du serveur.');

module.exports = {
    data: broadcastCommand,
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({ content: 'Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
            return;
        }
        if (interaction.type === InteractionType.ApplicationCommand) {
            try {
                // Vérifier si la commande a déjà été utilisée cette semaine
                const lastUsedTime = usageData[interaction.guildId];
                const currentTime = Date.now();

                // Si la commande a été utilisée dans les 7 derniers jours, refuser l'exécution
                if (lastUsedTime && (currentTime - lastUsedTime < 604800000)) {
                    await interaction.reply({ content: 'Vous ne pouvez utiliser cette commande qu\'une fois par semaine.', ephemeral: true });
                    return;
                }

                // Mettre à jour le timestamp de la dernière utilisation
                usageData[interaction.guildId] = currentTime;

                // Sauvegarder les données mises à jour dans le fichier
                saveUsageData();

                // Création du modal
                const modal = new ModalBuilder()
                    .setCustomId('broadcastModal')
                    .setTitle('Envoyer un message privé à tous les membres');

                // Création des champs de texte
                const messageInput = new TextInputBuilder()
                    .setCustomId('broadcastMessage')
                    .setLabel('Message à envoyer')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true); // Champ obligatoire

                // Action row pour le champ de texte
                const firstActionRow = new ActionRowBuilder().addComponents(messageInput);

                // Ajout des composants au modal
                modal.addComponents(firstActionRow);

                // Affichage du modal à l'utilisateur
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Erreur lors de la création et de l\'affichage du modal :', error);
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'affichage du modal.', ephemeral: true });
            }
        } 
    },
};
