const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buyrole')
        .setDescription('Acheter un rôle avec vos coins'),

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
            .setTitle('Acheter un rôle')
            .setColor("#FFD700")
            .setDescription(`Choisissez un rôle à acheter avec vos <:gold:1261787387395047424>. *Vous avez ${userData.coins} :dollar:.*`)
            .addFields(
                { name: 'Membre', value: "**Prix:** *5 000 <:gold:1261787387395047424>*\n- 15 tentatives pour le /drop\n- 60% de valeur d'item\n- Modifier sa biographie\n- Modifier sa couleur de profil", inline: true },
                { name: 'VIP', value: "**Prix:** *10 000 <:gold:1261787387395047424>*\n- Avantages précédents\n- 20 tentatives pour le /drop\n- 70% de valeur d'item", inline: true },
                { name: 'Légende', value: "**Prix:** *15 000 <:gold:1261787387395047424>*\n- Avantages précédents\n- 25 tentatives pour le /drop\n- 80% de valeur d'item", inline: true },
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_role1')
                    .setLabel('Acheter MEMBRE')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('buy_role2')
                    .setLabel('Acheter VIP')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('buy_role3')
                    .setLabel('Acheter LEGENDE')
                    .setStyle(ButtonStyle.Danger),
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const roles = {
                'buy_role1': { id: '1258133421301956608', price: 5000 },
                'buy_role2': { id: '1258133461684846742', price: 10000 },
                'buy_role3': { id: '1258134206811475991', price: 15000 },
            };

            const selectedRole = roles[i.customId];
            const role = interaction.guild.roles.cache.get(selectedRole.id);

            // Vérifier si l'utilisateur a déjà le rôle
            if (interaction.member.roles.cache.has(role.id)) {
                return i.reply({ content: 'Vous avez déjà ce rôle.', ephemeral: true });
            }

            // Vérifier si l'utilisateur a assez de coins
            if (userData.coins < selectedRole.price) {
                return i.reply({ content: 'Vous n\'avez pas assez de <:gold:1261787387395047424> pour acheter ce rôle.', ephemeral: true });
            }

            // Déduire les coins et ajouter le rôle
            userData.coins -= selectedRole.price;
            fs.writeFileSync(filePath, JSON.stringify(userData, null, 4));
            await interaction.member.roles.add(role);

            await i.reply({ content: `Félicitations ! Vous avez acheté le rôle ${role.name} pour ${selectedRole.price} <:gold:1261787387395047424>.`});
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Vous n\'avez pas acheté de rôle à temps.', components: [] });
            }
        });
    }
};
