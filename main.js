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
  PollLayoutType,
  PollAnswer,
  WebhookClient,
} = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, guildId, clientId, test } = require("./config");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { scheduleDailyStatsLogging } = require("./coins_graph_saver.js");
const cron = require("node-cron");
const axios = require("axios");
const { parseStringPromise } = require("xml2js");
const Parser = require("rss-parser");
const parser = new Parser();
const webhookClient = new WebhookClient({
  url: "https://discord.com/api/webhooks/1268279903464456233/3_1h9RXXPiEwpL5CfCzOtQPaP1aprra-O3abTvT9YmHv40N_GL34vpjZ3IFS0jTSd7zt",
});
const fetch = require("node-fetch");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCPwYES7iEEy6ZaCkB4Hg1a1GU9g18z4CI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const {
  getUserInfos,
  modifyUser,
  changeUserInfos,
} = require("./utils/user.js");

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

const getPoll = async () => {
  try {
    var date = new Date().getDate();
    const response = await axios.get(
      `https://zeldaapi.vercel.app/api/polls/${date}`
    );
    return response;
  } catch (error) {
    if (error.response) {
      console.error("Erreur de la réponse de l'API:", error.response.data);
    } else {
      console.error("Erreur lors de la requête API:", error.message);
    }
  }
};

const formatDate = (timestamp) => {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  const date = new Date(timestamp);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const CHANNEL_ID = "UCQQSTVhlzarMRlSuTfjuMzg";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const LAST_VIDEO_FILE = "./lastVideoId.txt";

async function checkForNewVideo() {
  try {
    // Récupérer les données du flux RSS
    const dataVid = await parser.parseURL(FEED_URL);
    const lastVideo = dataVid.items[0];

    // Lire le dernier ID de vidéo stocké
    let lastVideoId = null;
    let thumbnailURL = null;
    if (fs.existsSync(LAST_VIDEO_FILE)) {
      lastVideoId = fs.readFileSync(LAST_VIDEO_FILE, "utf8").trim();
      thumbnailURL = `https://img.youtube.com/vi/${lastVideoId}/maxresdefault.jpg`;
    }

    // Comparer l'ID de la dernière vidéo
    if (lastVideo.id !== lastVideoId) {
      if (!lastVideo.title.includes("#shorts")) {
        console.log("Nouvelle vidéo détectée !");
        console.log(lastVideo);
        const guild = client.guilds.cache.get(guildId);
        const ytChannel = guild.channels.cache.find(
          (channel) => channel.name === "📣╎youtube-principale"
        );
        ytChannel.send({
          content: `# <@&1246420184785354795>\n**NOUVELLE VIDEO**\n> [${lastVideo.title}](${lastVideo.link})`,
        });
      }

      // Mettre à jour le fichier avec le nouvel ID de vidéo
      fs.writeFileSync(LAST_VIDEO_FILE, lastVideo.id);
    } else {
      console.log("Aucune nouvelle vidéo.");
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des vidéos:", error);
  }
}

const CHANNEL_ID2 = "UCS-tJq0KsxaBVFEftHetrgw";
const FEED_URL2 = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID2}`;
const LAST_VIDEO_FILE2 = "./lastVideoId2.txt";
async function checkForNewVideo2() {
  try {
    // Récupérer les données du flux RSS
    const dataVid = await parser.parseURL(FEED_URL2);
    const lastVideo = dataVid.items[0];

    // Lire le dernier ID de vidéo stocké
    let lastVideoId = null;
    let thumbnailURL = null;
    if (fs.existsSync(LAST_VIDEO_FILE2)) {
      lastVideoId = fs.readFileSync(LAST_VIDEO_FILE2, "utf8").trim();
      thumbnailURL = `https://img.youtube.com/vi/${lastVideoId}/maxresdefault.jpg`;
    }

    // Comparer l'ID de la dernière vidéo
    if (lastVideo.id !== lastVideoId) {
      if (!lastVideo.title.includes("#shorts")) {
        console.log("Nouvelle vidéo détectée !");
        console.log(lastVideo);
        const guild = client.guilds.cache.get(guildId);
        const ytChannel = guild.channels.cache.find(
          (channel) => channel.name === "📣╎youtube-gaming"
        );
        ytChannel.send({
          content: `# <@&1246420219744747612>\n**NOUVELLE VIDEO**\n> [${lastVideo.title}](${lastVideo.link})`,
        });
      }

      // Mettre à jour le fichier avec le nouvel ID de vidéo
      fs.writeFileSync(LAST_VIDEO_FILE2, lastVideo.id);
    } else {
      console.log("Aucune nouvelle vidéo.");
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des vidéos:", error);
  }
}

client.invites = new Map();

async function generatePoll() {
  try {
    console.log("Génération du sondage");
    const result = await model.generateContent(
      `Génère-moi une question de culture générale avec 4 propositions de réponses, et donne le sous un format JSON sans bloc code, en mode RAW. Format comme ceci : {"question": "question", "options": ["a", "b", "c", "d"], "réponse": "2"}. Et prends pas les mêmes questions à chaque fois stp merci. Ne pas dépasser 55 caractères à chaque réponse (car sinon tu mets ...)`
    );

    const pollText = result.response.candidates[0].content.parts[0].text;
    const poll = JSON.parse(pollText);

    var data = {
      content: "<@&1248666677088878685>",
      poll: {
        question: { text: poll.question },
        answers: poll.options.map((option, index) => ({
          text: option,
          emoji: ["🔴", "🟢", "🔵", "🟡"][index] || "⚪", // Emojis pour chaque option
        })),
        allowMultiselect: false,
        duration: 12,
      }
    }

    console.log(data)

    return data;
  } catch (error) {
    console.error("Erreur lors de la génération du sondage :", error);
    return "Erreur lors de la génération du sondage.";
  }
}

client.on("ready", async () => {
  try {
    console.log("ok")

    cron.schedule("0 0 10 * * *", async () => {
      console.log("Nouveau sondage");
      const poll = await generatePoll();
      const guild = client.guilds.cache.get(guildId);
      const channel = guild.channels.cache.find(
        (channel) => channel.name === "test-bot"
      );
      if (channel) {
        console.log("Publication.")
        console.log(poll)
        channel.send(poll);
      } else {
        console.log("Salon introuvable");
      }
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Logged in as $ {client.user.tag}!`);
  let statusText = "Meilleur bot du monde - V2";
  if (test == true) {
    statusText = "En développement...";
  }
  client.user.setPresence({
    activities: [{ name: `${statusText}`, type: ActivityType.Custom }],
    status: "Hello world",
  });
  await checkForNewVideo();
  await checkForNewVideo2();

  if (test == true) {
    return;
  }

  try {
    cron.schedule("0 6 * * *", async () => {
      const response = await axios.get(
        "https://nominis.cef.fr/json/nominis.php"
      );
      let name = response.data.response.prenoms.majeurs;
      console.log(name);
      name = Object.keys(name)[0];
      console.log(name);

      const guild = client.guilds.cache.get(guildId);
      const pollChannel = guild.channels.cache.find(
        (channel) => channel.name === "éphéméride"
      );
      let date = Date.now();
      let currentDate = formatDate(date);

      const responsec = await axios.get("https://luha.alwaysdata.net/api/");
      let citation = responsec.data.citation;

      const responseweather = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather?q=paris&appid=97ad485b6db9822d9a93cb34073d61f3&units=metric"
      );
      let weather = responseweather.data.main.temp;

      const responsejo = await axios.get(
        "https://apis.codante.io/olympic-games/countries"
      );
      let countrys = responsejo.data.data;
      let joid = 0;

      for (let index = 0; index < 20; index++) {
        if (countrys[index].id == "FRA") {
          joid = index;
        }
      }

      const responseinfos = await axios.get(
        "https://www.francetvinfo.fr/france.rss"
      );
      const xmlData = responseinfos.data;
      const parsedData = await parseStringPromise(xmlData);
      if (
        !parsedData ||
        !parsedData.rss ||
        !parsedData.rss.channel ||
        !parsedData.rss.channel[0].item
      ) {
        throw new Error("Format de flux RSS invalide ou données manquantes.");
      }
      const item = parsedData.rss.channel[0].item.slice(0, 1);

      const responsesinfos = await axios.get(
        "https://www.francetvinfo.fr/sports.rss"
      );
      const xmlsData = responsesinfos.data;
      const parsedsData = await parseStringPromise(xmlsData);
      if (
        !parsedsData ||
        !parsedsData.rss ||
        !parsedsData.rss.channel ||
        !parsedsData.rss.channel[0].item
      ) {
        throw new Error("Format de flux RSS invalide ou données manquantes.");
      }
      const items = parsedsData.rss.channel[0].item.slice(0, 1);

      const responseanime = await axios.get(
        "https://api.jikan.moe/v4/random/anime"
      );
      let anime = responseanime.data.data;

      await pollChannel.send(
        `# Éphéméride du ${currentDate}\n### 1. Nous fêtons les ${name}\n` +
        //+`### 2. Jeux Paralympiques :flag_fr:\n  **${joid + 1}° PLACE.** *:first_place:${countrys[joid].gold_medals}  :second_place:${countrys[joid].silver_medals}  :third_place:${countrys[joid].bronze_medals}* **(:medal:${countrys[joid].total_medals})**\n`
        `### 2. Température à Paris (à 6h00): *${weather}°C*\n` +
        `### 3. Citation du jour *(via luha.alwaysdata.net)*\n  *${citation}*\n` +
        `### 4. Info générale du jour *(via franceinfo.fr)*\n  **${item[0].title[0]}** :\n   *$${item[0].link[0]}}*\n` +
        //+`### 5. Info sportive du jour\n  **[${items[0].title[0]}](${items[0].link[0]})** :\n   *${items[0].description[0]}*`
        `### 6. Anime du jour\n  [${anime.title}](${anime.url})\n  *Type: ${anime.type}*  | *Score: ${anime.score}/10*  | *${anime.episodes} épisodes*  | *Diffusion le ${anime.aired.prop.from.day}/${anime.aired.prop.from.month}/${anime.aired.prop.from.year} jusqu'au ${anime.aired.prop.to.day}/${anime.aired.prop.to.month}/${anime.aired.prop.to.year}*`
      );
    });
  } catch (error) {
    console.error("Error trying to send: ", error);
  }

  const button = new ButtonBuilder()
    .setCustomId("welcome_button")
    .setLabel("Souhaitez la bienvenue ! [10:00]")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  button.setLabel("Trop tard pour souhaiter bienvenue");
  button.setDisabled(true);
  const guild = client.guilds.cache.get(guildId);
  const welcomeChannel = guild.channels.cache.find(
    (channel) => channel.name === "✈╎entrees-sorties"
  );
  welcomeChannel.messages.fetch({ limit: 100 }).then((messages) => {
    const lastMessage = messages.find((msg) =>
      msg.content.includes(`Bienvenue sur le serveur`)
    );
    if (lastMessage) {
      lastMessage.edit({ components: [row] });
    }
  });

  try {
    cron.schedule("0 */2 * * *", async () => {
      await checkForNewVideo();
      await checkForNewVideo2();
    });
  } catch (error) { }



  try {
    cron.schedule("6 13 * * *", async () => {
      const responsepoll = await getPoll();
      let statpoll = responsepoll.data;
      console.log(responsepoll);
      const guild = client.guilds.cache.get(guildId);
      const pollChannel = guild.channels.cache.find(
        (channel) => channel.name === "📊╎sondages"
      );

      if (pollChannel) {
        const answers = [
          {
            text: statpoll.response1,
            emoji: statpoll.emoji1,
          },
          {
            text: statpoll.response2,
            emoji: statpoll.emoji2,
          },
        ];

        if (statpoll.response3 && statpoll.emoji3) {
          answers.push({
            text: statpoll.response3,
            emoji: statpoll.emoji3,
          });
        }

        if (statpoll.response4 && statpoll.emoji4) {
          answers.push({
            text: statpoll.response4,
            emoji: statpoll.emoji4,
          });
        }

        //pollChannel.send({
        //  content: "<@&1248666677088878685>",
        //  poll: {
        //    question: { text: statpoll.question },
        //    answers: answers,
        //    allowMultiselect: false,
        //    duration: 24,
        //    layoutType: PollLayoutType.Default, // Assurez-vous que PollLayoutType est défini correctement
        //  },
        //});
      } else {
        console.error("Channel not found");
      }
    });
  } catch (error) {
    console.error("Error trying to send: ", error);
  }

  client.guilds.cache.forEach(async (guild) => {
    try {
      const invites = await guild.invites.fetch();
      const codeUses = new Map();
      invites.forEach((invite) => codeUses.set(invite.code, invite.uses));
      client.invites.set(guild.id, codeUses);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des invitations pour ${guild.name}:`
      );
    }
  });
});

client.on("inviteCreate", async (invite) => {
  if (test == true) {
    return;
  }

  try {
    const invites = await invite.guild.invites.fetch();
    const codeUses = new Map();
    invites.forEach((inv) => codeUses.set(inv.code, inv.uses));
    client.invites.set(invite.guild.id, codeUses);
  } catch (error) {
    console.error(
      `Erreur lors de l'ajout d'une nouvelle invitation pour ${invite.guild.name}:`,
      error
    );
  }
});

client.on("messagePollVoteAdd", async (pollAnswer, voterId) => {
  const users = await pollAnswer.fetchVoters();
  console.log(users);
});

client.on("messagePollVoteRemove", async () => {
  console.log("removed");
});

client.on("guildMemberAdd", async (member) => {
  if (test == true) {
    return;
  }
  const date = new Date();
  const hour = date.getHours();
  member.send(
    "Bienvenue sur le serveur **NONOICE COMMUNITY**\nNous t'invitons à checker les commandes de notre bot custom *Zelda* et discuter avec nos membres.\n\n*Le serveur est sponsorisé par notre chaîne Youtube Gaming, où nous aidons les personnes à se débloquer dans les jeux :* https://www.youtube.com/@LesGameplaysDeNono?sub_confirmation=1"
  );
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "✈╎entrees-sorties"
  );

  const tutoChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "📚╎didactitiel"
  );

  if (!welcomeChannel) return;

  const button = new ButtonBuilder()
    .setCustomId("welcome_button")
    .setLabel("Souhaitez la bienvenue ! [10:00]")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  let invitMessage = "";
  try {
    const newInvites = await member.guild.invites.fetch();
    const oldInvites = client.invites.get(member.guild.id);
    const invite = newInvites.find(
      (i) => i.uses > (oldInvites.get(i.code) || 0)
    );
    if (invite) {
      invitMessage = `*(Invité par ${invite.inviter})*`;
      console.log(
        `${member.user.tag} a rejoint en utilisant l'invitation ${invite.code} de ${invite.inviter}.`
      );
      oldInvites.set(invite.code, invite.uses);
      client.invites.set(member.guild.id, oldInvites);
    } else {
      invitMessage = ``;
      console.log(
        `${member.user.tag} a rejoint, mais l'invitation utilisée n'a pas été trouvée.`
      );
    }
  } catch (error) {
    console.error(
      `Erreur lors de la vérification des invitations pour ${member.guild.name}:`,
      error
    );
  }

  const welcomeMessage = `<:join:1268149257832239195>   **Bienvenue sur le serveur, ${member}** :wave:\n${invitMessage}`;

  welcomeChannel.send({ content: welcomeMessage, components: [row] });

  tutoChannel.send({
    content: `# Didactitiel 1/1 [${member}]\n*Bienvenue, ce didactitiel à pour but d'avoir tous les clés en main pour s'amuser sur le serveur.*\n- Joue au simon avec la commande /simon, dans le salon <#1158389642140332065>\n- Dis coucou aux membres dans le salon <#1158389289646829578>`,
  });

  member.roles.add("1254778700587602001");
  member.roles.add("1267894536173256714");

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
        msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
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
        msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
      );
      if (lastMessage) {
        lastMessage.edit({ components: [row] });
      }
    });
  }, 300000); // 5 minutes in milliseconds
});

client.on("guildMemberRemove", async (member) => {
  if (test == true) {
    return;
  }
  const date = new Date();
  const hour = date.getHours();
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "✈╎entrees-sorties"
  );

  if (!welcomeChannel) return;

  const welcomeMessage = `<:leave:1268149259258298380>   **Au revoir ${member.displayName}**`;
  welcomeChannel.send({ content: welcomeMessage });

  if (hour >= 0 && hour < 12) {
    const welcomeMessage2 = `*${member}, vous avez quitté le serveur pendant une période de nuit où les membres étaient potentiellement pas là, pour une meilleure expérience nous vous demandons si vous le souhaitez de revenir pour voir ce qu'il se passe le jour.\nhttps://discord.com/invite/vjveBySWMP\nMerci beaucoup.*`;
    try {
      await member.send({ content: welcomeMessage2 });
    } catch (error) {
      console.log(
        `Impossible d'envoyer un message privé à ${member.displayName}.`
      );
    }
  }

  try {
    const messages = await welcomeChannel.messages.fetch({ limit: 100 });
    const lastMessage = messages.find((msg) =>
      msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
    );

    if (lastMessage) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("welcome_button")
          .setLabel("La personne a quitté le serveur :/")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      await lastMessage.edit({ components: [row] });
    }
  } catch (error) {
    console.log("Erreur lors de la modification du message:", error);
  }
});

const voiceTimes = {}; // Utiliser un objet pour suivre les temps en vocal temporairement

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (test == true) {
    return;
  }
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
      console.log(coinsToAdd, duration);

      await changeUserInfos(userId, coinsToAdd, "", "", duration, 0, 0);

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

      await webhookClient
        .send({
          content: `:wave:  *Bienvenue ! (de la part de ${interaction.user.globalName})*`,
          username: interaction.user.globalName,
          avatarURL: interaction.user.avatarURL(),
        })
        .then((webhook) => console.log(interaction.user))
        .catch(console.error);
      await interaction.reply({
        content: "Message de bienvenue bien envoyé !",
        ephemeral: true,
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
    if (
      interaction.channel.id != "1158389642140332065" &&
      interaction.channel.id != "1234107384654204939"
    ) {
      await interaction.reply({
        content:
          "Vous ne devez utiliser les commandes que sur <#1158389642140332065>",
        ephemeral: true, // Make this reply ephemeral so that it doesn't clutter the channel
      });
    } else if (test == true) {
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        await interaction.reply({
          content: "Le bot est en maintenance",
          ephemeral: true,
        });
      } else {
        await command.execute(interaction, client);
      }
    } else {
      await command.execute(interaction, client);
    }
  } catch (error) {
    console.error(error);

    // Check if the interaction has already been replied to avoid the InteractionAlreadyReplied error
    if (!interaction.replied) {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

const messageCooldowns = new Map();
const mutedUsers = new Set();

client.on("messageCreate", async (message) => {
  if (test == true) {
    return;
  }
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
            changeUserInfos(userId, 500, "", "", 0, 0, 0);
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

            await message.channel.send({
              content: `<:vote:1268147864551297068>  **Vote effectué par <@${userId}>** (+500 <:gold:1261787387395047424>)`,
            });
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
    const response = await axios.get(
      `https://zeldaapi.vercel.app/api/user/${userId}`
    );
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      // Le serveur a répondu avec un code de statut différent de 2xx
      if (error.response.status === 404) {
        console.log("Utilisateur non trouvé, créons en un nouveau");
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

  changeUserInfos(
    userId,
    Math.min(coinsPerMessage, maxCoins),
    "",
    "",
    0,
    0,
    1,
    client
  );

  //userStats.badges = userStats.badges || {};
});

const createUser = async (id) => {
  try {
    const response = await axios.post("https://zeldaapi.vercel.app/api/user", {
      id: id,
      coins: 0,
      bio: "Bio non définie",
      color: "",
      voicetime: 0,
      amethyst: 0,
      messages: 0,
    });

    console.log("Réponse de l'API:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("Erreur de la réponse de l'API:", error.response.data);
    } else {
      console.error("Erreur lors de la requête API:", error.message);
    }
  }
};

client.login(TOKEN);
