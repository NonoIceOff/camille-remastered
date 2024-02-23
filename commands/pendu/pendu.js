const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pendu')
        .setDescription('Jouez au jeu du pendu'),
    async execute(interaction) {
        const wordList = ['pomme', 'banane', 'orange', 'kiwi', 'fraise', 'cerise', 'ananas', 'citron', 'abricot', 'raisin', 'poire', 'mangue', 'melisse', 'peche', 'myrtille', 'framboise', 'grenade', 'noix', 'noisette', 'amande', 'datte', 'figue', 'pamplemousse', 'groseille', 'cassis', 'clementine', 'avocat', 'papaye', 'pastèque', 'canneberge', 'prune', 'coing', 'nectarine', 'maracuja', 'goyave', 'mure', 'coco', 'litchi', 'mure', 'kaki', 'litchi', 'papaye', 'cacao', 'carambole', 'datte', 'fruit de la passion', 'lychee', 'pomelo'];
        const randomIndex = Math.floor(Math.random() * wordList.length);
        const chosenWord = wordList[randomIndex];
        let hiddenWord = '—'.repeat(chosenWord.length); // Utilisation du caractère en forme de tiret
        let remainingAttempts = 6;
        let guessedLetters = [];

        function updateHiddenWord() {
            let display = '';
            for (const letter of chosenWord) {
                if (guessedLetters.includes(letter)) {
                    display += letter;
                } else {
                    display += '—'; // Utilisation du caractère en forme de tiret
                }
            }
            hiddenWord = display;
        }

        const filter = response => response.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

        const hangmanPics = [
            '```\n\n\n\n\n\n========```',
            '```\n|\n|\n|\n|\n|\n========```',
            '```\n|/\n|\n|\n|\n|\n========```',
            '```\n|/---\n|\n|\n|\n|\n========```',
            '```\n|/---\n|   O\n|\n|\n|\n========```',
            '```\n|/---\n|   O\n|   |\n|\n|\n========```',
            '```\n|/---\n|   O\n|  /|\\\n|\n|\n========```',
            '```\n|/---\n|   O\n|  /|\\\n|  / \\\n|\n========```'
        ];

        async function displayGame() {
            const pic = hangmanPics[6 - remainingAttempts];
            const guessedLettersString = guessedLetters.join(', ');
            const timeLeft = Math.ceil(collector.collected.first().createdAt.getTime() + 60000 - Date.now()) / 1000;
            const gameMessage = [
                `Bienvenue au jeu du pendu ! Le mot est : ${hiddenWord}`,
                `${pic}`,
                `Lettres devinées : ${guessedLettersString}`,
                `Tentatives restantes : ${remainingAttempts}`,
                `Temps restant : ${timeLeft.toFixed(1)} secondes`,
                `Devinez une lettre :`
            ].join('\n');
        
            if (!interaction.replied) {
                await interaction.reply(gameMessage);
            } else {
                await interaction.editReply(gameMessage);
            }
        }
        
        if (!interaction.replied) {
            await interaction.reply(`Bienvenue au jeu du pendu ! Le mot est : ${hiddenWord}`);
        } else {
            await displayGame();
        }

        collector.on('collect', async message => {
            const guessedLetter = message.content.toLowerCase();
            if (guessedLetters.includes(guessedLetter)) {
                await message.reply(`Vous avez déjà deviné cette lettre.`);
            } else {
                guessedLetters.push(guessedLetter);
                updateHiddenWord();

                if (!chosenWord.includes(guessedLetter)) {
                    remainingAttempts--;
                }

                if (hiddenWord === chosenWord) {
                    collector.stop();
                    await interaction.followUp(`Félicitations, vous avez gagné ! Le mot était "${chosenWord}".`);
    
                    // Ajouter ici la logique pour donner des coins au gagnant
                    let rawdata = fs.readFileSync('stats/coins.json');
                    let coins = JSON.parse(rawdata);
                    if (!coins[interaction.user.id]) {
                        coins[interaction.user.id] = 0;
                    }
                    coins[interaction.user.id] += 100; // Par exemple, donne 100 coins au gagnant
                    let sendcoins = JSON.stringify(coins);
                    fs.writeFileSync('stats/coins.json', sendcoins);
                } else if (remainingAttempts === 0) {
                    collector.stop();
                    await interaction.followUp(`Dommage, vous avez épuisé toutes vos tentatives. Le mot était "${chosenWord}".`);
                } else {
                    await displayGame();
                }
            }
        });

        collector.on('end', collected => {
            if (hiddenWord !== chosenWord) {
                interaction.followUp(`Le temps est écoulé. Le mot était "${chosenWord}".`);
            }
        });
    },
};
