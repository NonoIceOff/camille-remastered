const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, guildId, clientId } = require("./config");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const { scheduleDailyStatsLogging } = require("./coins_graph_saver.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, client);
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
    // Utiliser une expression régulière avec insensibilité à la casse et global
    const regex = /le joueur (.+?) vient de voter pour le serveur/i;
    const match = message.content.match(regex);

    if (match && match[1]) {
      if (message.author.bot == true) {
        const pseudo = match[1].trim().toLowerCase(); // trim() pour enlever les espaces éventuels autour du pseudo
        console.log(`Pseudo extrait: ${pseudo}`);

        // Notifier la personne si elle est sur le serveur
        const member = message.guild.members.cache.find(
          (member) => member.user.username === pseudo
        );
        if (member) {
          let userStats = require(`./stats/user_${member.id}.json`);
          userStats.coins += 500;
          fs.writeFileSync(
            `./stats/user_${member.id}.json`,
            JSON.stringify(userStats, null, 4),
            (err) => {
              if (err)
                console.error(
                  "Erreur lors de l'enregistrement du fichier de statistiques de l'utilisateur:",
                  err
                );
            }
          );
          await message.channel.send(
            `Hey ${member}, tu as bien voté et détecté ! **[+500 💵]**`
          );
        } else {
          await message.channel.send(
            "Une personne anonyme a voté. *(Mettez bien votre pseudo discord)*"
          );
        }
      } else {
        await message.reply("T'es un petit malin toi !");
      }
    }
  }

  if (!message.author || message.author.bot) return;

  // Chargement des données de l'utilisateur
  let userStats = {};
  try {
    userStats = require(`./stats/user_${message.author.id}.json`);
  } catch (error) {
    console.error(
      "Erreur lors du chargement du fichier de statistiques de l'utilisateur:",
      error
    );
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
  const baseXP = 100;
  const growthFactor = 1.5; // Facteur de croissance pour l'XP requise par niveau

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
  userStats.coins =
    (userStats.coins || 0) + Math.min(coinsPerMessage, maxCoins);

  // Calcul de l'XP totale (chaque pièce équivaut à 1 XP)
  userStats.xp = (userStats.xp || 0) + coinsPerMessage;

  // Calcul du niveau en fonction de l'XP totale
  let userXP = userStats.xp;
  let userLevel = 1;
  let xpForNextLevel = baseXP;

  while (userXP >= xpForNextLevel) {
    userLevel++;
    userXP -= xpForNextLevel;
    xpForNextLevel = Math.floor(baseXP * Math.pow(growthFactor, userLevel - 1));
  }

  // Mise à jour du niveau de l'utilisateur
  userStats.level = userLevel;

  // Affichage des résultats
  console.log(
    `User ${userId} now has ${userStats.coins} coins, ${userStats.xp} XP, and is level ${userStats.level}.`
  );

  // Écriture des données de l'utilisateur dans le fichier JSON
  fs.writeFileSync(
    `./stats/user_${userId}.json`,
    JSON.stringify(userStats, null, 4),
    (err) => {
      if (err)
        console.error(
          "Erreur lors de l'enregistrement du fichier de statistiques de l'utilisateur:",
          err
        );
    }
  );
});

client.login(TOKEN);
