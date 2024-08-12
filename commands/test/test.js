const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, WebhookClient  } = require('discord.js');
const webhookClient = new WebhookClient({ url: "https://discord.com/api/webhooks/1268275454352031788/VTjcUNuqU-KobVMvG7APp6Lf9hsDgJW4ySlo6COuoemjcq4sTy3V0GpcOIipDaWB58mF" });


module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Cliquez sur le bouton pour obtenir un message préformaté'),

  async execute(interaction) {
    // Création d'un bouton interactif
    const button = new ButtonBuilder()
      .setCustomId('prefill_message')
      .setLabel('Préremplir un message')
      .setStyle(ButtonStyle.Primary);

    // Création d'une ligne d'action contenant le bouton
    const row = new ActionRowBuilder().addComponents(button);

    // Réponse initiale avec le bouton
    await interaction.reply({
      content: 'Cliquez sur le bouton pour préremplir un message.',
      components: [row],
      ephemeral: true, // Message visible seulement par l'utilisateur
    });

    // Création d'un collecteur pour gérer les interactions du bouton
    const filter = i => i.customId === 'prefill_message' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'prefill_message') {
        const prefilledMessage = "Voici un message prérempli ! Vous pouvez l'éditer avant de l'envoyer.";

        await webhookClient.send({
          content:":wave:  Bienvenue !",
          username:interaction.user.globalName,
          avatarURL:interaction.user.avatarURL()
        })
          .then(webhook => console.log(interaction.user))
          .catch(console.error);

        // Réponse à l'interaction avec le message prérempli
        await i.update({
          content: `Message prérempli: "${prefilledMessage}"`,
          components: [], // Désactiver le bouton après utilisation
          ephemeral: true
        });

        // Optionnel: Collecteur pour un message de réponse de l'utilisateur
        const messageFilter = response => response.author.id === i.user.id;
        const messageCollector = i.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 1 });

        messageCollector.on('collect', response => {
          i.followUp({
            content: `Votre message personnalisé : "${response.content}"`,
            ephemeral: true
          });
        });

        messageCollector.on('end', collected => {
          if (collected.size === 0) {
            i.followUp({
              content: 'Temps écoulé. Vous n\'avez pas fourni de message.',
              ephemeral: true
            });
          }
        });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({
          content: 'Vous n\'avez pas cliqué sur le bouton à temps.',
          ephemeral: true
        });
      }
    });
  },
};
