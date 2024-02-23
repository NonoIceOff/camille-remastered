const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('classement')
		.setDescription('Le classement du serveur'),
	async execute(interaction, client) {
		let rawdata = fs.readFileSync('stats/coins.json');
		let coins = JSON.parse(rawdata);

		const leaderboard = Object.assign(
			{}, 
			...Object.entries(coins)
				.sort(([,a], [,b]) => b-a)
				.map(([p], i) => ({[i+1]: p}))
		);

		const exampleEmbed = new EmbedBuilder()
			.setTitle('**Le classement :**')
		for (let i = 1; i < Object.keys(leaderboard).length+1; i++) {
			let member = await client.users.fetch(leaderboard[i]);
			exampleEmbed.addFields(
				{ name: i.toString()+". "+member.username, value: coins[leaderboard[i]].toString()+" :coin:", inline: true }
			)
		}
		await interaction.reply({ embeds: [exampleEmbed]});
	},
};
