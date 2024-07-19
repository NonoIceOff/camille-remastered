const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  Events,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, guildId, clientId, test } = require("./config");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { scheduleDailyStatsLogging } = require("./coins_graph_saver.js");

const { getUserInfos, modifyUser, changeUserInfos} = require("./utils/user.js")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const voicesFolder = "./voices";

client.commands = new Map();

const commandFolders = readdirSync(join(__dirname, "commands"));

for (const folder of commandFolders) {
  const commandsPath = join(__dirname, "commands", folder);
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const commands = Array.from(client.commands.values(), (cmd) =>
  cmd.data.toJSON()
);

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
    scheduleDailyStatsLogging();

    //scheduleDailyStatsLogging();
  } catch (error) {
    console.error(error);
  }
})();

const cooldowns = new Map();

client.on("ready", () => {
  console.log(`Logged in as $ {client.user.tag}!`);
  let statusText = "Meilleur bot du monde - V1.1"
  if (test == true) {
    statusText = "En développement..."
  }
  client.user.setPresence({
    activities: [
      { name: `${statusText}`, type: ActivityType.Custom },
    ],
    status: "Hello world",
  });
});

client.on("guildMemberAdd", (member) => {
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "📰╎lobby"
  );

  if (!welcomeChannel) return;

  const button = new ButtonBuilder()
    .setCustomId("welcome_button")
    .setLabel("Souhaitez la bienvenue ! [10:00]")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(button);

  const welcomeMessage = `<:join:1261071507669651486>   **Bienvenue sur le serveur, ${member.displayName}** :wave:`;

  welcomeChannel.send({ content: welcomeMessage, components: [row] });

  member.roles.add("1254778700587602001");

  let timeLeft = 300; // 5 minutes in seconds

  const interval = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    button.setLabel(`Souhaitez la bienvenue ! [${minutes}:${seconds}]`);

    welcomeChannel.messages.fetch({ limit: 100 }).then((messages) => {
      const lastMessage = messages.find((msg) =>
        msg.content.includes(
          `**Bienvenue sur le serveur, ${member.displayName}**`
        )
      );
      if (lastMessage) {
        lastMessage.edit({ components: [row] });
      }
    });
  }, 1000);

  setTimeout(() => {
    button.setLabel("Trop tard pour souhaiter bienvenue");
    button.setDisabled(true);
    clearInterval(interval);
    welcomeChannel.messages.fetch({ limit: 100 }).then((messages) => {
      const lastMessage = messages.find((msg) =>
        msg.content.includes(
          `**Bienvenue sur le serveur, ${member.displayName}**`
        )
      );
      if (lastMessage) {
        lastMessage.edit({ components: [row] });
      }
    });
  }, 300000); // 5 minutes in milliseconds
});

client.on("guildMemberRemove", (member) => {
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "📰╎lobby"
  );

  if (!welcomeChannel) return;

  const welcomeMessage = `<:leave:1261082236359413952>   **Au revoir ${member.displayName}**`;

  welcomeChannel.send({ content: welcomeMessage });

  welcomeChannel.messages.fetch({ limit: 100 }).then((messages) => {
    const lastMessage = messages.find((msg) =>
      msg.content.includes(
        `**Bienvenue sur le serveur, ${member.displayName}**`
      )
    );
    if (lastMessage) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("welcome_button")
          .setLabel("Trop tard pour souhaiter bienvenue")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );
      lastMessage.edit({ components: [row] });
    }
  });
});

const voiceTimes = {}; // Utiliser un objet pour suivre les temps en vocal temporairement

client.on("voiceStateUpdate", async (oldState, newState) => {
  const userId = newState.member.id;

  // Si l'utilisateur rejoint un canal vocal
  if (!oldState.channelId && newState.channelId) {
    voiceTimes[userId] = Date.now();
  }

  // Si l'utilisateur quitte un canal vocal
  if (oldState.channelId && !newState.channelId) {
    if (voiceTimes[userId]) {
      const startTime = voiceTimes[userId];
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // en secondes


      // Calculer les pièces et l'XP à ajouter pour chaque minute passée en vocal
      let minutesPassed = Math.floor(duration / 60000); // Convertir la durée de millisecondes en minutes
      let coinsToAdd = 0;
      if (minutesPassed > 0) {
        coinsToAdd = minutesPassed * 2;
      }
      console.log(coinsToAdd,duration)

      await changeUserInfos(userId,coinsToAdd,"","",duration,0,0)

      // Supprimer l'entrée de voiceTimes
      delete voiceTimes[userId];
    }
  }
});

const interactionMap = new Map();
client.on("interactionCreate", async (interaction) => {
  if (interaction.customId === "welcome_button") {
    if (!interactionMap.has(interaction.user.id)) {
      interactionMap.set(interaction.user.id, true);
      await interaction.reply({
        content: `Bienvenue :wave: ! De la part de ${interaction.member}`,
        ephemeral: false,
      });
    } else {
      await interaction.reply({
        content: "Vous avez déjà souhaité la bienvenue à cette personne.",
        ephemeral: true,
      });
    }
  }

  if (interaction.customId === "broadcastModal") {
    const broadcastMessage =
      interaction.fields.getTextInputValue("broadcastMessage");
    interaction.guild.members.cache.forEach((member) => {
      if (!member.user.bot) {
        member.send(`${broadcastMessage}`).catch(console.error);
      }
    });

    await interaction.reply({ content: "Message envoyé à tous !" });
  }
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    if (test == true) {
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        await interaction.reply({
          content: "Le bot est en maintenance",
        });
      } else {
        await command.execute(interaction, client);
      }
    } else {
      await command.execute(interaction, client);
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

const messageCooldowns = new Map();
const mutedUsers = new Set();

client.on("messageCreate", async (message) => {
  if (
    message.channelId === "1158389642140332065" &&
    message.author.id != "1250105529938743409"
  ) {
    const regex = /le joueur (.+?) vient de voter pour le serveur/i;
    const match = message.content.match(regex);

    if (match && match[1]) {
      if (message.author.bot == true) {
        const pseudo = match[1].trim().toLowerCase();
        console.log(`Pseudo extrait: ${pseudo}`);

        // Notifier la personne si elle est sur le serveur
        let member = message.guild.members.cache.find(
          (member) => member.user.username.toLowerCase() === pseudo
        );

        if (!member) {
          // Si le membre n'est pas trouvé dans le cache, essayer de le fetch
          try {
            const members = await message.guild.members.fetch({
              query: pseudo,
              limit: 1,
            });
            if (members.size > 0) {
              member = members.first(); // Récupère le premier membre trouvé
            }
          } catch (err) {
            console.error("Erreur lors de la recherche du membre:", err);
          }
        }

        if (member) {
          const userId = member.user.id;
          const userAll = member.user.avatarURL;
          console.log(userAll);
          console.log(`ID de l'utilisateur: ${userId}`);

          try {
            changeUserInfos(userId,500,"","",0,0,0)
            const fetchedMessages = await message.channel.messages.fetch({
              limit: 1,
            });
            const lastMessage = fetchedMessages.first();
            if (lastMessage) {
              await lastMessage.delete();
              console.log("Dernier message supprimé avec succès.");
            } else {
              console.log("Aucun message trouvé dans le canal.");
            }
            const embed = new EmbedBuilder()
              .setTitle("Vote Détecté")
              .setColor("#FFD700")
              .setDescription(
                `**Hey <@${userId}>, tu as bien voté !** Voici vos +500 <:gold:1261787387395047424> bien mérités !!`
              )
              .setTimestamp();

            await message.channel.send({ embeds: [embed] });
          } catch (err) {
            console.error(
              "Erreur lors de la mise à jour des statistiques de l'utilisateur:",
              err
            );
            await message.reply(
              "Une erreur s'est produite lors de la mise à jour de vos statistiques. Veuillez réessayer plus tard."
            );
          }
        } else {
          const fetchedMessages = await message.channel.messages.fetch({
            limit: 1,
          });
          const lastMessage = fetchedMessages.first();
          if (lastMessage) {
            await lastMessage.delete();
            console.log("Dernier message supprimé avec succès.");
          } else {
            console.log("Aucun message trouvé dans le canal.");
          }
          const anonymousEmbed = new EmbedBuilder()
            .setTitle("Vote Anonyme")
            .setDescription(
              "Une personne anonyme a voté. *(Mettez bien votre pseudo discord)*"
            )
            .setTimestamp();

          await message.channel.send({ embeds: [anonymousEmbed] });
        }
      } else {
        await message.reply("T'es un petit malin toi !");
      }
    }
  }

  if (!message.author || message.author.bot) return;

  // Chargement des données de l'utilisateur
  try {
    const userId = message.author.id;
    const response = await axios.get(`https://zeldaapi.vercel.app/api/user/${userId}`);
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      // Le serveur a répondu avec un code de statut différent de 2xx
      if (error.response.status === 404) {
        console.log('Utilisateur non trouvé, créons en un nouveau');
        createUser(message.author.id);
      } else {
        console.error(`Erreur lors de la requête: ${error.message}`);
      }
    }
  }

  // Gestion du cooldown
  if (messageCooldowns.has(message.author.id)) {
    const userCooldown = messageCooldowns.get(message.author.id);
    const cooldownExpirationTime = userCooldown.lastMessageTime + 5000;
    if (Date.now() < cooldownExpirationTime) {
      userCooldown.messageCount++;
      messageCooldowns.set(message.author.id, userCooldown);
      if (userCooldown.messageCount >= 5) {
        if (!mutedUsers.has(message.author.id)) {
          message.member.roles.add("1234116883335348266");
          mutedUsers.add(message.author.id);
          message.channel.send(
            `@${message.author.id}, vous avez été muté pendant 5 minutes pour spam.`
          );
          setTimeout(() => {
            message.member.roles.remove("1234116883335348266");
            mutedUsers.delete(message.author.id);
          }, 5 * 60 * 1000);
        }
      }
    } else {
      messageCooldowns.delete(message.author.id);
    }
  } else {
    messageCooldowns.set(message.author.id, {
      messageCount: 1,
      lastMessageTime: Date.now(),
    });
  }

  // Configuration des niveaux et de l'XP
  const maxCoins = 50;

  // Calcul des pièces de monnaie de base et aléatoires
  const baseCoins = Math.max(
    1,
    Math.floor((Math.random() * message.content.length) / 10)
  );
  const randomCoins = Math.floor(Math.random() * 10) + 1;

  // Calcul de la somme des pièces pour ce message
  const coinsPerMessage = baseCoins + randomCoins;

  // Mise à jour des pièces de monnaie
  const userId = message.author.id;

  changeUserInfos(userId,Math.min(coinsPerMessage, maxCoins),"","",0,0,1)

  //userStats.badges = userStats.badges || {};
  


});

const createUser = async (id) => {
  try {
    const response = await axios.post('https://zeldaapi.vercel.app/api/user', {
      id: id,
      coins: 0,
      bio: 'Bio non définie',
      color: '',
      voicetime: 0,
      amethyst: 0,
      messages: 0
    });

    console.log('Réponse de l\'API:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Erreur de la réponse de l\'API:', error.response.data);
    } else {
      console.error('Erreur lors de la requête API:', error.message);
    }
  }
};



client.login(TOKEN);
