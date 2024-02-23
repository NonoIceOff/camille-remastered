const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require("canvas");

// Assurez-vous de spécifier le chemin correct vers la police Poppins
registerFont('Poppins-Medium.ttf', { family: 'Poppins' });

function getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
}

async function generateStatsImage(user, coins) {
    const leaderboard = Object.assign(
        {},
        ...Object.entries(coins)
            .sort(([, a], [, b]) => b - a)
            .map(([p], i) => ({ [i + 1]: p }))
    );

    const canvas = createCanvas(400, 120); // Hauteur réduite de 20%
    const ctx = canvas.getContext('2d');

    // Fond gris foncé avec une bordure
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 400, 120); // Ajustez la hauteur ici également
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 400, 120); // Ajustez la hauteur ici également

    // Informations utilisateur
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Poppins';

    // Pseudo
    const pseudoText = user.username;
    const pseudoTextWidth = ctx.measureText(pseudoText).width;

    // Cercle blanc
    const circleRadius = 15;
    const totalWidth = pseudoTextWidth + circleRadius * 2 + 10; // Ajoutez un décalage supplémentaire si nécessaire

    const circleX = (400 - totalWidth) / 2 + circleRadius;
    const circleY = 35; // Ajustez la hauteur ici également
    
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ecf0f1';
    ctx.stroke();
    ctx.closePath();

    // Pseudo centré horizontalement et légèrement plus haut
    ctx.fillText(pseudoText, circleX + circleRadius + 10, circleY + 5);

    // Stats sous forme de grille en bas
    ctx.font = 'bold 20px Poppins';
    const gridSize = 100;
    const gridSpacing = 110;

    // Vous pouvez ajouter d'autres statistiques dans la grille selon vos besoins
    const stats = {
        'Position': getKeyByValue(leaderboard, user.id) + 'ème',
        'Coins': coins[user.id]
    };

    let gridX = (400 - gridSpacing * Object.keys(stats).length) / 2;
    let gridY = 70; // Ajustez la hauteur ici également

    for (const [statName, statValue] of Object.entries(stats)) {
        // Case carrée grise avec une bordure
        ctx.fillStyle = '#34495e';
        ctx.fillRect(gridX, gridY, gridSize, gridSize);
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 5;
        ctx.strokeRect(gridX, gridY, gridSize, gridSize);

        // Nom de la statistique centré en haut, plus petit
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Poppins';
        const statNameTextWidth = ctx.measureText(statName).width;
        ctx.fillText(statName, gridX + (gridSize - statNameTextWidth) / 2, gridY + 20);

        // Valeur centrée et occupant toute la largeur, en doré et légèrement plus bas
        const statValueText = statValue.toString();
        ctx.fillStyle = '#ffd700'; // Couleur dorée
        ctx.font = 'bold 30px Poppins';
        ctx.fillText(statValueText, gridX + (gridSize - ctx.measureText(statValueText).width) / 2, gridY + gridSize / 2 + 0, gridSize);

        // Déplacement vers la prochaine case
        gridX += gridSpacing;
    }

    return canvas.toBuffer();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Vos statistiques sur le serveur'),
    async execute(interaction, client) {
        try {
            let rawdata = fs.readFileSync('stats/coins.json');
            let coins = JSON.parse(rawdata);

            const buffer = await generateStatsImage(interaction.user, coins);

            await fs.promises.writeFile('stats_image.png', buffer);

            await interaction.reply({ files: ['stats_image.png'] });
        } catch (error) {
            console.error('Une erreur est survenue :', error);
        }
    },
};
