const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  generateDependencyReport,
  AudioPlayerStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const { TOKEN, guildId, clientId, test } = require("../../config");

const player = createAudioPlayer();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("simon")
    .setDescription("Jouer à Simon"),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = client.guilds.cache.get(guildId);
    const member = await guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.followUp({
        content: "Vous devez être dans un canal vocal pour jouer à Simon.",
        ephemeral: true,
      });
      return;
    }

    const player = createAudioPlayer();

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Le joueur audio a commencé à jouer !");
    });

    player.on("error", (error) => {
      console.error(`Erreur : ${error.message} avec la ressource`);
    });

    // Créer la connexion au canal vocal
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // Subscription à l'audio player
    const subscription = connection.subscribe(player);

    let sequence = [];
    let userSequence = [];
    let round = 0;

    // Styles de boutons définis pour les couleurs disponibles
    const buttonStyles = [
      ButtonStyle.Primary,   // Bleu
      ButtonStyle.Secondary, // Gris
      ButtonStyle.Success,   // Vert
      ButtonStyle.Danger     // Rouge
    ];

    // Fichiers audio associés à chaque bouton
    const buttonSounds = [
      "D:/CamilleRemastered/assets/voices/blue.mp3",
      "D:/CamilleRemastered/assets/voices/gray.mp3",
      "D:/CamilleRemastered/assets/voices/green.mp3",
      "D:/CamilleRemastered/assets/voices/red.mp3"
    ];

    // Créer une ligne de boutons
    const row = new ActionRowBuilder();
    for (let i = 0; i < 4; i++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`button_${i}`)
          .setLabel(`Bouton ${i + 1}`)
          .setStyle(buttonStyles[i])
          .setDisabled(true) // Désactivé par défaut
      );
    }

    const startNewRound = async () => {
      userSequence = [];
      sequence.push(Math.floor(Math.random() * 4)); // 4 boutons seulement
      round++;
      await showSequence();
    };

    const playSound = (soundPath) => {
      return new Promise((resolve, reject) => {
        const resource = createAudioResource(soundPath);
        player.play(resource);

        player.once(AudioPlayerStatus.Idle, () => {
          resolve();
        });

        player.once("error", (error) => {
          reject(error);
        });
      });
    };

    const showSequence = async () => {
      const delay = Math.max(1000 - round * 100, 200); // Délai réduisant à chaque round

      for (const index of sequence) {
        const button = row.components[index];

        // Activer le bouton et jouer le son associé
        button.setDisabled(false);
        await interaction.editReply({
          content: `Round ${round} : Prépare-toi !`,
          components: [row],
          ephemeral: true
        });
        await playSound(buttonSounds[index]);
        
        // Désactiver le bouton après l'affichage
        button.setDisabled(true);
        await interaction.editReply({ components: [row], ephemeral: true });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Activer tous les boutons pour permettre à l'utilisateur de jouer
      row.components.forEach(button => button.setDisabled(false));
      await interaction.editReply({
        content: `Round ${round} : À vous de jouer ! Il vous reste ${sequence.length} boutons à cliquer.`,
        components: [row],
        ephemeral: true
      });
    };

    const handleButtonClick = async (buttonId) => {
      const buttonIndex = parseInt(buttonId.split("_")[1]);
      userSequence.push(buttonIndex);

      if (
        userSequence[userSequence.length - 1] !==
        sequence[userSequence.length - 1]
      ) {
        await interaction.editReply({
          content: `Tu as perdu ! La séquence correcte était : ${sequence
            .map((i) => i + 1)
            .join(", ")}`,
            components: [],
          ephemeral: true,
        });
        subscription.unsubscribe();
        connection.destroy();
        return;
      }

      if (userSequence.length === sequence.length) {
        row.components.forEach(button => button.setDisabled(true));
        await interaction.editReply({
          content: `Round ${round} terminé. Prépare-toi pour le prochain round.`,
          components: [row],
          ephemeral: true,
        });
        setTimeout(startNewRound, 1000); // Démarrer un nouveau round après une courte pause
      } else {
        await interaction.editReply({
          content: `Round ${round} : À vous de jouer ! Il vous reste ${sequence.length - userSequence.length} boutons à cliquer.`,
          components: [row],
          ephemeral: true
        });
      }
    };

    // Écouter les interactions des boutons
    const filter = (i) =>
      i.customId.startsWith("button_") && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      await handleButtonClick(i.customId);
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: `Temps écoulé ! Tu as atteint le round ${round}.`,
          ephemeral: true,
        });
        subscription.unsubscribe();
        connection.destroy();
      }
    });

    // Envoyer un message public pour notifier le lancement du jeu
    await interaction.channel.send("Jeu `/simon` lancé.");

    await interaction.editReply({
      content: "Prépare-toi à jouer à Simon !",
      components: [row],
      ephemeral: true,
    });
    startNewRound();
  },
};
