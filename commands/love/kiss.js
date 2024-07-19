const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('La personne que vous allez embrasser')
    .addUserOption(option => 
      option.setName('user1')
        .setDescription('La première personne')
        .setRequired(true)),
    
  async execute(interaction) {
    const user1 = interaction.options.getUser('user1');

    const result = await axios
	.get('https://api.otakugifs.xyz/gif?reaction=kiss&format=gif');

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username} embrasse ${user1.username}`)
      .setColor("#FFD700")
      .setFooter({ text: 'Embrassades'})
      .setTimestamp(Date.now())
      .setImage(result.data.url);

    await interaction.reply({ embeds: [embed] });
  },
};

