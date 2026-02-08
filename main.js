// ============== IMPORTS ==============
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  WebhookClient,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const { readdirSync } = require("fs");
const { join } = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const { parseStringPromise } = require("xml2js");
const Parser = require("rss-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ============== CONFIG ==============
const { TOKEN, guildId, clientId, test } = require("./config");
const { scheduleDailyStatsLogging } = require("./coins_graph_saver.js");
const {
  getUserInfos,
  modifyUser,
  changeUserInfos,
} = require("./utils/user.js");
const logger = require("./utils/logger");
const ErrorHandler = require("./utils/errorHandler");

// ============== CONSTANTS ==============
const WEBHOOK_CLIENT = new WebhookClient({
  url: "https://discord.com/api/webhooks/1268279903464456233/3_1h9RXXPiEwpL5CfCzOtQPaP1aprra-O3abTvT9YmHv40N_GL34vpjZ3IFS0jTSd7zt",
});

const RSS_PARSER = new Parser();
const GEMINI_API = new GoogleGenerativeAI("AIzaSyCPwYES7iEEy6ZaCkB4Hg1a1GU9g18z4CI");
const GEMINI_MODEL = GEMINI_API.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const YOUTUBE_CHANNELS = [
  {
    id: "UCQQSTVhlzarMRlSuTfjuMzg",
    roleId: "1246420184785354795",
    lastVideoFile: "./lastVideoId.txt",
  },
  {
    id: "UCS-tJq0KsxaBVFEftHetrgw",
    roleId: "1246420219744747612",
    lastVideoFile: "./lastVideoId2.txt",
  },
];

const VOICE_COINS_PER_MINUTE = 2;
const VOTE_COINS = 500;
const MESSAGE_MAX_COINS = 50;
const COOLDOWN_SPAM_THRESHOLD = 5;
const COOLDOWN_SPAM_TIME = 5000;
const MUTE_DURATION = 5 * 60 * 1000;

// ============== DISCORD CLIENT SETUP ==============
const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

CLIENT.commands = new Map();
CLIENT.invites = new Map();
CLIENT.voiceTimes = {};
CLIENT.messageCooldowns = new Map();
CLIENT.mutedUsers = new Set();
CLIENT.welcomeInteractions = new Map();

// ============== COMMAND LOADER ==============
function loadCommands() {
  const commandFolders = readdirSync(join(__dirname, "commands"));
  let loadedCount = 0;
  let errorCount = 0;

  for (const folder of commandFolders) {
    const commandsPath = join(__dirname, "commands", folder);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      
      try {
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
          CLIENT.commands.set(command.data.name, command);
          loadedCount++;
          logger.debug('COMMANDS', `Loaded command: ${command.data.name}`);
        } else {
          errorCount++;
          logger.error('COMMANDS', `Command at ${filePath} is missing "data" or "execute" property.`);
        }
      } catch (error) {
        errorCount++;
        logger.error('COMMANDS', `Error loading command ${file}:`, error);
      }
    }
  }

  logger.success('COMMANDS', `${loadedCount} commands loaded successfully${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
}

loadCommands();

// ============== COMMAND REGISTRATION ==============
async function registerSlashCommands() {
  try {
    const commands = Array.from(CLIENT.commands.values(), (cmd) =>
      cmd.data.toJSON()
    );

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    logger.info('COMMANDS', `Registering ${commands.length} slash commands...`);
    
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    logger.success('COMMANDS', `${data.length} slash commands registered successfully`);
    scheduleDailyStatsLogging();
  } catch (error) {
    logger.error('COMMANDS', 'Failed to register slash commands:', error);
  }
}

registerSlashCommands();

// ============== UTILITY FUNCTIONS ==============

/**
 * Format timestamp to French date format
 */
function formatDate(timestamp) {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];

  const date = new Date(timestamp);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Get guild and channel by name
 */
function getChannel(guild, channelName) {
  return guild?.channels.cache.find((c) => c.name === channelName);
}

/**
 * Fetch or read last video ID
 */
async function getLastVideoId(filePath) {
  try {
    if (fsSync.existsSync(filePath)) {
      return fsSync.readFileSync(filePath, "utf8").trim();
    }
  } catch (error) {
    console.error(`Error reading last video file ${filePath}:`, error);
  }
  return null;
}

/**
 * Save last video ID
 */
async function saveLastVideoId(filePath, videoId) {
  try {
    fsSync.writeFileSync(filePath, videoId);
  } catch (error) {
    console.error(`Error saving last video file ${filePath}:`, error);
  }
}

// ============== YOUTUBE CHECKER (CONSOLIDATED) ==============

/**
 * Generic function to check for new videos from a channel
 */
async function checkForNewVideos(channelConfig) {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelConfig.id}`;
    const dataVid = await RSS_PARSER.parseURL(feedUrl);
    const lastVideo = dataVid.items[0];

    if (!lastVideo) {
      logger.debug('YOUTUBE', `No videos found for channel ${channelConfig.id}`);
      return;
    }

    const lastVideoId = await getLastVideoId(channelConfig.lastVideoFile);

    if (lastVideo.id === lastVideoId) {
      logger.debug('YOUTUBE', `No new videos for channel ${channelConfig.id}`);
      return;
    }

    logger.info('YOUTUBE', `New video detected: ${lastVideo.title}`);

    const guild = CLIENT.guilds.cache.get(guildId);
    if (!guild) return;

    const isShort = lastVideo.link.includes("shorts");
    const channelName = isShort ? "shorts" : "gameplays";
    const channel = getChannel(guild, channelName);

    if (!channel) {
      logger.error('YOUTUBE', `Channel '${channelName}' not found`);
      return;
    }

    const mention = isShort ? "" : `# <@&${channelConfig.roleId}>\n`;
    const title = isShort ? "NOUVEAU SHORT" : "NOUVELLE VIDEO";

    await channel.send({
      content: `${mention}**${title}**\n> [${lastVideo.title}](${lastVideo.link})`,
    });

    await saveLastVideoId(channelConfig.lastVideoFile, lastVideo.id);
    logger.success('YOUTUBE', `Notification sent for: ${lastVideo.title}`);
  } catch (error) {
    logger.error('YOUTUBE', 'Error checking videos:', error);
  }
}

// Check all YouTube channels
async function checkAllYoutubeChannels() {
  for (const channel of YOUTUBE_CHANNELS) {
    await checkForNewVideos(channel);
  }
}

// ============== POLL GENERATION ==============

/**
 * Generate a random poll using Gemini
 */
async function generatePoll() {
  try {
    logger.info('POLL', 'Generating new poll with AI...');
    const result = await GEMINI_MODEL.generateContent(
      `Génère-moi une question de culture générale avec 4 propositions de réponses, et donne le sous un format JSON sans bloc code, en mode RAW. Format comme ceci : {"question": "question", "options": ["a", "b", "c", "d"], "réponse": "2"}. Et prends pas les mêmes questions à chaque fois stp merci. Ne pas dépasser 55 caractères à chaque réponse (car sinon tu mets ...)`
    );

    const pollText = result.response.candidates[0].content.parts[0].text;
    const poll = JSON.parse(pollText);

    logger.success('POLL', `Poll generated: ${poll.question}`);

    return {
      content: "<@&1248666677088878685>",
      poll: {
        question: { text: poll.question },
        answers: poll.options.map((option, index) => ({
          text: option,
          emoji: ["🔴", "🟢", "🔵", "🟡"][index] || "⚪",
        })),
        allowMultiselect: false,
        duration: 12,
      }
    };
  } catch (error) {
    logger.error('POLL', 'Error generating poll:', error);
    return null;
  }
}

// ============== EVENTS ==============

/**
 * Bot ready event
 */
CLIENT.on("ready", async () => {
  logger.success('CLIENT', `Bot logged in as ${CLIENT.user.tag}`);

  // Set bot status
  const statusText = test ? "En développement..." : "Meilleur bot du monde - V2";
  CLIENT.user.setPresence({
    activities: [{ name: statusText, type: ActivityType.Custom }],
    status: "Hello world",
  });

  logger.info('CLIENT', `Bot is now online and ready!`);
  logger.info('CLIENT', `Serving ${CLIENT.guilds.cache.size} guild(s) with ${CLIENT.users.cache.size} users`);

  // Initial checks
  await checkAllYoutubeChannels();

  if (test) {
    logger.warn('CLIENT', 'Bot is running in TEST mode');
    return;
  }

  // Fetch all invites for tracking
  CLIENT.guilds.cache.forEach(async (guild) => {
    try {
      const invites = await guild.invites.fetch();
      const codeUses = new Map();
      invites.forEach((invite) => codeUses.set(invite.code, invite.uses));
      CLIENT.invites.set(guild.id, codeUses);
      logger.debug('INVITES', `Cached invites for guild: ${guild.name}`);
    } catch (error) {
      logger.error('INVITES', `Error fetching invites for ${guild.name}`, error);
    }
  });

  // Schedule tasks
  scheduleYoutubeTasks();
  scheduleEphemeridTask();
  schedulePollTask();
  scheduleWelcomeButtonReset();
  logger.success('SCHEDULER', 'YouTube checks scheduled (every 2 hours)');
});

/**
 * Daily ephemeris at 6:00 AM
 */
function scheduleEphemeridTask() {
  cron.schedule("0 6 * * *", sendEphemeris);
  logger.success('SCHEDULER', 'Ephemeris scheduled (daily at 6:00 AM)');
}

/**
 * Daily poll at 10:00 AM
 */
function schedulePollTask() {
  cron.schedule("0 10 * * *", sendDailyPoll);
  logger.success('SCHEDULER', 'Daily poll scheduled (10:00 AM)');
}

/**
 * Reset welcome button at 10:00 AM
 */
function scheduleWelcomeButtonReset() {
  cron.schedule("0 10 * * *", resetWelcomeButtons);
  logger.success('SCHEDULER', 'Welcome button reset scheduled (10:00 AM)');
}

/**
 * Send ephemeris message
 */
async function sendEphemeris() {
  try {
    const guild = CLIENT.guilds.cache.get(guildId);
    const channel = getChannel(guild, "éphéméride");
    if (!channel) return;

    console.log("[EPHEMERIS] Generating daily ephemeris...");

    // Fetch data in parallel
    const [nameRes, weatherRes, quoteRes, newsRes, animeRes] = await Promise.allSettled([
      axios.get("https://nominis.cef.fr/json/nominis.php"),
      axios.get("https://api.openweathermap.org/data/2.5/weather?q=paris&appid=97ad485b6db9822d9a93cb34073d61f3&units=metric"),
      axios.get("https://luha.alwaysdata.net/api/"),
      axios.get("https://www.francetvinfo.fr/france.rss"),
      axios.get("https://api.jikan.moe/v4/random/anime"),
    ]);

    let name = "Inconnu";
    let weather = "?";
    let citation = "Non disponible";
    let newsItem = null;
    let anime = null;

    if (nameRes.status === "fulfilled") {
      const names = nameRes.value.data.response.prenoms.majeurs;
      name = Object.keys(names)[0] || "Inconnu";
    }

    if (weatherRes.status === "fulfilled") {
      weather = Math.round(weatherRes.value.data.main.temp);
    }

    if (quoteRes.status === "fulfilled") {
      citation = quoteRes.value.data.citation;
    }

    if (newsRes.status === "fulfilled") {
      const parsed = await parseStringPromise(newsRes.value.data);
      const items = parsed?.rss?.channel?.[0]?.item;
      if (items) {
        newsItem = items[0];
      }
    }

    if (animeRes.status === "fulfilled") {
      anime = animeRes.value.data.data;
    }

    const currentDate = formatDate(Date.now());

    let message = `# Éphéméride du ${currentDate}\n`;
    message += `### 1. Nous fêtons les ${name}\n`;
    message += `### 2. Température à Paris (6h00): *${weather}°C*\n`;
    message += `### 3. Citation du jour\n  *${citation}*\n`;

    if (newsItem) {
      message += `### 4. Info générale du jour\n  **${newsItem.title[0]}**\n   [Lire plus](${newsItem.link[0]})\n`;
    }

    if (anime) {
      const from = anime.aired.prop.from;
      const to = anime.aired.prop.to;
      message += `### 6. Anime du jour\n  [${anime.title}](${anime.url})\n  *Type: ${anime.type}* | *Score: ${anime.score}/10* | *${anime.episodes} épisodes* | *Diffusion du ${from.day}/${from.month}/${from.year} au ${to.day}/${to.month}/${to.year}*`;
    }

    await channel.send(message);
    console.log("[EPHEMERIS] Ephemeris sent successfully");
  } catch (error) {
    console.error("[EPHEMERIS] Error sending ephemeris:", error);
  }
}

/**
 * Send daily poll
 */
async function sendDailyPoll() {
  try {
    const poll = await generatePoll();
    if (!poll) return;

    const guild = CLIENT.guilds.cache.get(guildId);
    const channel = getChannel(guild, "test-bot");

    if (channel) {
      await channel.send(poll);
      console.log("[POLL] Daily poll sent");
    }
  } catch (error) {
    console.error("[POLL] Error sending daily poll:", error);
  }
}

/**
 * Reset welcome button timer
 */
async function resetWelcomeButtons() {
  try {
    const guild = CLIENT.guilds.cache.get(guildId);
    const channel = getChannel(guild, "✈╎entrees-sorties");

    if (!channel) return;

    const messages = await channel.messages.fetch({ limit: 100 });
    const welcomeMessages = messages.filter((msg) =>
      msg.content.includes("Bienvenue sur le serveur")
    );

    const button = new ButtonBuilder()
      .setCustomId("welcome_button")
      .setLabel("Souhaitez la bienvenue ! [10:00]")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    for (const msg of welcomeMessages) {
      await msg.edit({ components: [row] });
    }

    CLIENT.welcomeInteractions.clear();
    console.log("[WELCOME] Welcome buttons reset");
  } catch (error) {
    console.error("[WELCOME] Error resetting buttons:", error);
  }
}

/**
 * New invite created
 */
CLIENT.on("inviteCreate", async (invite) => {
  if (test) return;

  try {
    const invites = await invite.guild.invites.fetch();
    const codeUses = new Map();
    invites.forEach((inv) => codeUses.set(inv.code, inv.uses));
    CLIENT.invites.set(invite.guild.id, codeUses);
  } catch (error) {
    console.error(`[INVITES] Error for ${invite.guild.name}:`, error);
  }
});

/**
 * Guild member joined
 */
CLIENT.on("guildMemberAdd", async (member) => {
  if (test) return;

  console.log(`[JOIN] ${member.user.tag} joined`);

  // Send welcome DM
  try {
    await member.send(
      "Bienvenue sur le serveur **NONOICE COMMUNITY**\nNous t'invitons à checker les commandes de notre bot custom *Zelda* et discuter avec nos membres.\n\n*Le serveur est sponsorisé par notre chaîne Youtube Gaming, où nous aidons les personnes à se débloquer dans les jeux :* https://www.youtube.com/@LesGameplaysDeNono?sub_confirmation=1"
    );
  } catch (error) {
    console.error(`[JOIN] Cannot DM ${member.user.tag}`);
  }

  const guild = member.guild;
  const welcomeChannel = getChannel(guild, "✈╎entrees-sorties");
  const tutorialChannel = getChannel(guild, "📚╎didactitiel");

  if (!welcomeChannel) return;

  // Get inviter
  let inviterName = "Inconnu";
  try {
    const newInvites = await guild.invites.fetch();
    const oldInvites = CLIENT.invites.get(guild.id);
    const usedInvite = newInvites.find(
      (i) => i.uses > (oldInvites?.get(i.code) || 0)
    );

    if (usedInvite) {
      inviterName = usedInvite.inviter.username;
      oldInvites.set(usedInvite.code, usedInvite.uses);
      CLIENT.invites.set(guild.id, oldInvites);
      console.log(`[JOIN] ${member.user.tag} invited by ${inviterName}`);
    }
  } catch (error) {
    console.error(`[JOIN] Cannot fetch invites:`, error);
  }

  // Send welcome message with button
  const button = new ButtonBuilder()
    .setCustomId("welcome_button")
    .setLabel("Souhaitez la bienvenue ! [10:00]")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  const inviteMsg = inviterName !== "Inconnu" ? `*(Invité par ${inviterName})*` : "";
  const welcomeMessage = `<:join:1268149257832239195>   **Bienvenue sur le serveur, ${member}** :wave:\n${inviteMsg}`;

  await welcomeChannel.send({ content: welcomeMessage, components: [row] });

  // Send tutorial
  if (tutorialChannel) {
    await tutorialChannel.send(
      `# Didactitiel 1/1 [${member}]\n*Bienvenue, ce didactitiel à pour but d'avoir tous les clés en main pour s'amuser sur le serveur.*\n- Joue au simon avec la commande /simon, dans le salon <#1158389642140332065>\n- Dis coucou aux membres dans le salon <#1158389289646829578>`
    );
  }

  // Add roles
  try {
    await member.roles.add(["1254778700587602001", "1267894536173256714"]);
  } catch (error) {
    console.error(`[JOIN] Cannot add roles to ${member.user.tag}:`, error);
  }

  // Setup welcome button timer (5 minutes)
  let timeLeft = 300;
  const buttonInterval = setInterval(async () => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    
    button.setLabel(`Souhaitez la bienvenue ! [${minutes}:${seconds}]`);
    
    try {
      const messages = await welcomeChannel.messages.fetch({ limit: 50 });
      const memberMessage = messages.find((msg) =>
        msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
      );
      
      if (memberMessage) {
        await memberMessage.edit({ components: [row] });
      }
    } catch (error) {
      console.error("[JOIN] Error updating button");
    }
  }, 1000);

  // Disable button after 5 minutes
  setTimeout(async () => {
    clearInterval(buttonInterval);
    button.setLabel("Trop tard pour souhaiter bienvenue").setDisabled(true);
    
    try {
      const messages = await welcomeChannel.messages.fetch({ limit: 50 });
      const memberMessage = messages.find((msg) =>
        msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
      );
      
      if (memberMessage) {
        await memberMessage.edit({ components: [row] });
      }
    } catch (error) {
      console.error("[JOIN] Error disabling button");
    }
  }, 300000);
});

/**
 * Guild member left
 */
CLIENT.on("guildMemberRemove", async (member) => {
  if (test) return;

  console.log(`[LEAVE] ${member.user.tag} left`);

  const welcomeChannel = getChannel(member.guild, "✈╎entrees-sorties");
  if (!welcomeChannel) return;

  // Send leave message
  const leaveMessage = `<:leave:1268149259258298380>   **Au revoir ${member.displayName}**`;
  await welcomeChannel.send({ content: leaveMessage });

  // If left during night hours, suggest coming back later
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) {
    try {
      await member.send(
        `*${member}, vous avez quitté le serveur pendant une période de nuit où les membres étaient potentiellement pas là, pour une meilleure expérience nous vous demandons si vous le souhaitez de revenir pour voir ce qu'il se passe le jour.\nhttps://discord.com/invite/vjveBySWMP\nMerci beaucoup.*`
      );
    } catch (error) {
      console.error(`[LEAVE] Cannot DM ${member.user.tag}`);
    }
  }

  // Update welcome button
  try {
    const messages = await welcomeChannel.messages.fetch({ limit: 50 });
    const memberMessage = messages.find((msg) =>
      msg.content.includes(`**Bienvenue sur le serveur, ${member}**`)
    );

    if (memberMessage) {
      const disabledButton = new ButtonBuilder()
        .setCustomId("welcome_button")
        .setLabel("La personne a quitté le serveur :/")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(disabledButton);
      await memberMessage.edit({ components: [row] });
    }
  } catch (error) {
    console.error("[LEAVE] Error updating message:", error);
  }
});

/**
 * Voice state update (XP tracking)
 */
CLIENT.on("voiceStateUpdate", async (oldState, newState) => {
  if (test) return;

  const userId = newState.member.id;

  // User joined voice channel
  if (!oldState.channelId && newState.channelId) {
    CLIENT.voiceTimes[userId] = Date.now();
    console.log(`[VOICE] ${newState.member.user.tag} joined voice`);
  }

  // User left voice channel
  if (oldState.channelId && !newState.channelId) {
    if (CLIENT.voiceTimes[userId]) {
      const duration = (Date.now() - CLIENT.voiceTimes[userId]) / 1000; // seconds
      const minutesPassed = Math.floor(duration / 60);
      const coinsToAdd = minutesPassed * VOICE_COINS_PER_MINUTE;

      if (coinsToAdd > 0) {
        await changeUserInfos(userId, coinsToAdd, "", "", duration, 0, 0);
        console.log(`[VOICE] ${newState.member.user.tag} earned ${coinsToAdd} coins (${minutesPassed}m)`);
      }

      delete CLIENT.voiceTimes[userId];
    }
  }
});

/**
 * Command and modal interactions
 */
CLIENT.on("interactionCreate", async (interaction) => {
  // Welcome button
  if (interaction.customId === "welcome_button") {
    return handleWelcomeButton(interaction);
  }

  // Broadcast modal
  if (interaction.customId === "broadcastModal") {
    return handleBroadcastModal(interaction);
  }

  // Slash commands
  if (!interaction.isCommand()) return;

  const command = CLIENT.commands.get(interaction.commandName);
  
  if (!command) {
    logger.warn('INTERACTION', `Unknown command: ${interaction.commandName}`);
    await ErrorHandler.handleCommandNotFound(interaction);
    return;
  }

  try {
    // Channel whitelist check
    const allowedChannels = ["1158389642140332065", "1234107384654204939"];
    if (!allowedChannels.includes(interaction.channel.id)) {
      return await interaction.reply({
        content: "Vous ne devez utiliser les commandes que sur <#1158389642140332065>",
        ephemeral: true,
      });
    }

    // Maintenance mode
    if (test && !interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Le bot est actuellement en maintenance. Veuillez réessayer plus tard.",
        ephemeral: true,
      });
    }

    // Execute command
    await command.execute(interaction, CLIENT);
    logger.command(interaction.user.id, interaction.commandName);
    
  } catch (error) {
    logger.error('INTERACTION', `Error executing ${interaction.commandName}:`, error);
    await ErrorHandler.handleInteractionError(interaction, error);
  }
});

/**
 * Handle welcome button click
 */
async function handleWelcomeButton(interaction) {
  const userId = interaction.user.id;

  if (!CLIENT.welcomeInteractions.has(userId)) {
    CLIENT.welcomeInteractions.set(userId, true);

    try {
      await WEBHOOK_CLIENT.send({
        content: `:wave:  *Bienvenue ! (de la part de ${interaction.user.globalName})*`,
        username: interaction.user.globalName,
        avatarURL: interaction.user.avatarURL(),
      });

      await interaction.reply({
        content: "Message de bienvenue bien envoyé !",
        ephemeral: true,
      });

      // Auto-remove from map after 2 minutes (prevent memory leak)
      setTimeout(() => CLIENT.welcomeInteractions.delete(userId), 2 * 60 * 1000);
    } catch (error) {
      console.error("[BUTTON] Error sending welcome message:", error);
      await interaction.reply({
        content: "Erreur lors de l'envoi du message",
        ephemeral: true,
      }).catch(() => {});
    }
  } else {
    await interaction.reply({
      content: "Vous avez déjà souhaité la bienvenue à cette personne.",
      ephemeral: true,
    });
  }
}

/**
 * Handle broadcast modal
 */
async function handleBroadcastModal(interaction) {
  const broadcastMessage = interaction.fields.getTextInputValue("broadcastMessage");

  let successCount = 0;
  let failCount = 0;

  for (const member of interaction.guild.members.cache.values()) {
    if (!member.user.bot) {
      try {
        await member.send(broadcastMessage);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
  }

  await interaction.reply({
    content: `Message envoyé à ${successCount} utilisateurs (${failCount} échoués)`,
    ephemeral: true,
  });
}

/**
 * Message handler (XP and vote detection)
 */
CLIENT.on("messageCreate", async (message) => {
  if (test) return;
  if (!message.author || message.author.bot) return;

  // Ensure user exists
  await ensureUserExists(message.author.id);

  // Vote detection
  if (message.channelId === "1158389642140332065") {
    handleVoteMessage(message);
  }

  // Spam cooldown check
  handleSpamCooldown(message);

  // Message XP
  const baseCoins = Math.max(
    1,
    Math.floor((Math.random() * message.content.length) / 10)
  );
  const randomCoins = Math.floor(Math.random() * 10) + 1;
  const coinsPerMessage = Math.min(baseCoins + randomCoins, MESSAGE_MAX_COINS);

  await changeUserInfos(
    message.author.id,
    coinsPerMessage,
    "",
    "",
    0,
    0,
    1,
    CLIENT
  );
});

/**
 * Handle vote message
 */
async function handleVoteMessage(message) {
  const regex = /le joueur (.+?) vient de voter pour le serveur/i;
  const match = message.content.match(regex);

  if (!match || !message.author.bot) return;

  const pseudo = match[1].trim().toLowerCase();
  console.log(`[VOTE] Vote detected for pseudo: ${pseudo}`);

  let member = message.guild.members.cache.find(
    (m) => m.user.username.toLowerCase() === pseudo
  );

  // Fetch if not in cache
  if (!member) {
    try {
      const members = await message.guild.members.fetch({
        query: pseudo,
        limit: 1,
      });
      if (members.size > 0) {
        member = members.first();
      }
    } catch (error) {
      console.error("[VOTE] Error fetching member:", error);
    }
  }

  // Delete bot message and send reward message
  try {
    const lastMessages = await message.channel.messages.fetch({ limit: 1 });
    const lastMsg = lastMessages.first();
    if (lastMsg) await lastMsg.delete();

    if (member) {
      await changeUserInfos(member.user.id, VOTE_COINS, "", "", 0, 0, 0);
      await message.channel.send({
        content: `<:vote:1268147864551297068>  **Vote effectué par <@${member.user.id}>** (+${VOTE_COINS} <:gold:1261787387395047424>)`,
      });
      console.log(`[VOTE] ${member.user.tag} rewarded ${VOTE_COINS} coins`);
    } else {
      // Anonymous vote
      const embed = new EmbedBuilder()
        .setTitle("Vote Anonyme")
        .setDescription(
          "Une personne anonyme a voté. *(Mettez bien votre pseudo discord)*"
        )
        .setTimestamp();
      await message.channel.send({ embeds: [embed] });
      console.log("[VOTE] Anonymous vote recorded");
    }
  } catch (error) {
    console.error("[VOTE] Error handling vote:", error);
  }
}

/**
 * Handle spam cooldown
 */
function handleSpamCooldown(message) {
  const userId = message.author.id;
  const now = Date.now();

  if (CLIENT.messageCooldowns.has(userId)) {
    const userCooldown = CLIENT.messageCooldowns.get(userId);
    const cooldownExpirationTime = userCooldown.lastMessageTime + COOLDOWN_SPAM_TIME;

    if (now < cooldownExpirationTime) {
      userCooldown.messageCount++;

      if (userCooldown.messageCount >= COOLDOWN_SPAM_THRESHOLD) {
        if (!CLIENT.mutedUsers.has(userId)) {
          // Apply mute role
          message.member.roles.add("1234116883335348266").catch(() => {});
          CLIENT.mutedUsers.add(userId);

          message.channel.send(
            `<@${userId}>, vous avez été muté pendant 5 minutes pour spam.`
          ).catch(() => {});

          // Unmute after duration
          setTimeout(() => {
            message.member.roles.remove("1234116883335348266").catch(() => {});
            CLIENT.mutedUsers.delete(userId);
          }, MUTE_DURATION);

          console.log(`[SPAM] ${message.author.tag} muted for 5 minutes`);
        }
      }

      CLIENT.messageCooldowns.set(userId, userCooldown);
    } else {
      // Reset cooldown
      CLIENT.messageCooldowns.delete(userId);
    }
  } else {
    CLIENT.messageCooldowns.set(userId, {
      messageCount: 1,
      lastMessageTime: now,
    });
  }
}

// ============== API HELPERS ==============

/**
 * Create or fetch user from API
 */
async function ensureUserExists(userId) {
  try {
    const response = await axios.get(
      `https://zeldaapi.vercel.app/api/user/${userId}`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // User doesn't exist, create them
      return await createUser(userId);
    }
    console.error("[API] Error fetching user:", error.message);
    return null;
  }
}

/**
 * Create a new user
 */
async function createUser(id) {
  try {
    const response = await axios.post("https://zeldaapi.vercel.app/api/user", {
      id,
      coins: 0,
      bio: "Bio non définie",
      color: "",
      voicetime: 0,
      amethyst: 0,
      messages: 0,
    });

    console.log(`[API] User created: ${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API] Error creating user ${id}:`, error.message);
    return null;
  }
}

// ============== LOGIN ==============

CLIENT.login(TOKEN);
