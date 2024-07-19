const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('love')
    .setDescription('Calcule le pourcentage d\'amour entre deux personnes')
    .addUserOption(option => 
      option.setName('user1')
        .setDescription('La première personne')
        .setRequired(true))
    .addUserOption(option => 
      option.setName('user2')
        .setDescription('La deuxième personne')
        .setRequired(true)),
    
  async execute(interaction) {
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2');

    const lovePercentage = calculateLovePercentage(user1.id, user2.id);
    let loveText = ""
    if (lovePercentage < 20) {
        loveText = "*Oui, vous vous détestez...*";
    } 
    if (lovePercentage < 40 && lovePercentage >= 20) {
        loveText = "*Oui bah c'est une personne comme une autre !*";
    }
    if (lovePercentage < 60 && lovePercentage >= 40) {
        loveText = "Vous êtes plutôt potes nan ?";
    }
    if (lovePercentage < 80 && lovePercentage >= 60) {
        loveText = "**C'est un grand amour qui naît !**";
    }
    if (lovePercentage < 100 && lovePercentage >= 80) {
        loveText = "**__Marriez-vous s'il vous plait, et dès maintenant !__**";
    }

    const embed = new EmbedBuilder()
      .setTitle('Calculateur d\'amour 💖')
      .setColor("#FFD700")
      .setDescription(`<@${user1.id}> et <@${user2.id}> ont une compatibilité amoureuse de ${lovePercentage}% !\n${loveText}`);

    await interaction.reply({ embeds: [embed] });
  },
};

function calculateLovePercentage(userId1, userId2) {
  // Combine the user IDs in a consistent order
  const combined = userId1 < userId2 ? `${userId1}${userId2}` : `${userId2}${userId1}`;
  
  // Simple hash function to generate a pseudo-random percentage
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) % 100;
  }

  return hash;
}
