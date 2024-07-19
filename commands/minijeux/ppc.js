const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
	.setName('ppc')
	.setDescription('Jouez à Pierre-Papier-Ciseaux')
	.addStringOption(option =>
		option.setName('choix')
			.setDescription('Choisissez entre Pierre, Papier ou Ciseaux')
			.setRequired(true)
			.addChoices(
				{ name: 'Pierre', value: 'pierre' },
				{ name: 'Papier', value: 'papier' },
				{ name: 'Ciseaux', value: 'ciseaux' }
			));

module.exports = {
	data,
	async execute(interaction) {
		const userChoice = interaction.options.getString('choix');
		const options = ["pierre", "papier", "ciseaux"];
		const botChoice = options[Math.floor(Math.random() * options.length)];

		let result = "";
		if (userChoice === botChoice) {
			result = "C'est une égalité !";
		} else if (
			(userChoice === "pierre" && botChoice === "ciseaux") ||
			(userChoice === "papier" && botChoice === "pierre") ||
			(userChoice === "ciseaux" && botChoice === "papier")
		) {
			result = "Vous avez gagné !";
		} else {
			result = "J'ai gagné !";
		}

		await interaction.reply(`Vous avez choisi **${userChoice}** et j'ai choisi **${botChoice}**. ${result}`);
	},
};
