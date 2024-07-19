const { SlashCommandBuilder } = require('discord.js');

// Taille de la grille et nombre de mines (pour une version moyenne)
const GRID_SIZE = 8;
const NUM_MINES = 10;

// Émojis utilisés pour représenter les états des cases
const EMOJI_MINE = '||:bomb:||';
const EMOJI_BLANK = '||:white_large_square:||';
const EMOJI_NUMBERS = ['||:one:||', '||:two:||', '||:three:||', '||:four:||', '||:five:||', '||:six:||', '||:seven:||', '||:eight:||'];

// Fonction pour générer une grille avec des mines aléatoires
function generateGrid() {
    const grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        grid.push(new Array(GRID_SIZE).fill(0));
    }

    // Placer les mines aléatoirement
    let placedMines = 0;
    while (placedMines < NUM_MINES) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if (grid[x][y] === 0) {
            grid[x][y] = 'X'; // 'X' représente une mine
            placedMines++;
        }
    }

    // Calculer et stocker le nombre de mines adjacentes pour chaque case
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] !== 'X') {
                let count = 0;
                // Vérifier les 8 directions autour de la case (N, NE, E, SE, S, SW, W, NW)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const ni = i + dx;
                        const nj = j + dy;
                        if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE && grid[ni][nj] === 'X') {
                            count++;
                        }
                    }
                }
                grid[i][j] = count;
            }
        }
    }

    return grid;
}

// Fonction pour afficher la grille avec les cases découvertes
function showGrid(grid) {
    let shownGrid = '';
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === 'X') {
                shownGrid += EMOJI_MINE + ' ';
            } else if (grid[i][j] === 0) {
                shownGrid += EMOJI_BLANK + ' ';
            } else {
                shownGrid += EMOJI_NUMBERS[grid[i][j] - 1] + ' ';
            }
        }
        shownGrid += '\n';
    }
    return shownGrid;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demineur')
        .setDescription('Joue à une version moyenne du jeu Démineur.'),

    async execute(interaction) {
        // Initialiser la grille
        const grid = generateGrid();

        // Afficher la grille
        const shownGrid = showGrid(grid);

        // Envoyer la grille affichée à l'utilisateur
        await interaction.reply(shownGrid);
    },
};
