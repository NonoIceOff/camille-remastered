const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createsentence')
    .setDescription('Crée une phrase à partir des prochains mots envoyés dans le canal')
    .addIntegerOption(option => 
      option.setName('wordcount')
        .setDescription('Le nombre de mots pour créer la phrase')
        .setRequired(true)),
  
  async execute(interaction) {
    const wordCount = interaction.options.getInteger('wordcount');

    if (wordCount <= 0) {
      return interaction.reply({ content: 'Le nombre de mots doit être supérieur à zéro.', ephemeral: true });
    }

    await interaction.reply(`D'accord, commencez à envoyer des mots dans ce canal. Nous arrêterons après avoir reçu ${wordCount} mots.`);

    const collectedWords = [];
    const filter = m => !m.author.bot && m.content.trim().split(/\s+/).length === 1;
    const collector = interaction.channel.createMessageCollector({ filter, time: 600000 });

    collector.on('collect', async message => {
      if (message.content.trim().split(/\s+/).length === 1) {
        collectedWords.push(message.content.trim());
        await message.react('✅'); // Ajoute une réaction de coche verte à chaque message compté
      } else {
        await message.react('❌'); // Ajoute une réaction de croix rouge à chaque message non compté
      }

      if (collectedWords.length === wordCount) {
        collector.stop();
      }
    });

    collector.on('end', async collected => {
      const lobbyChannelId = '1158389289646829578';
      const lobbyChannel = await interaction.client.channels.fetch(lobbyChannelId);

      if (collectedWords.length === wordCount) {
        await lobbyChannel.send(`*"${collectedWords.join(' ')}"*\n— **Nonoice Community - 2024 <#1254787617887748156>**`);
        await interaction.followUp('Phrase envoyée dans le canal lobby.');
      } else {
        await interaction.followUp('Temps écoulé ou nombre de mots insuffisant pour créer la phrase.');
      }
    });
  },
};
