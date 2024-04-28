const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, guildId, clientId } = require("./config");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
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
    await command.execute(interaction);
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
  if (!message.author || message.author.bot) return;

  const maxCoins = 50;
  const maxXP = 100;

  // Chargement des données de l'utilisateur
  let userStats = {};
  try {
    userStats = require(`./stats/user_${message.author.id}.json`);
  } catch (error) {
    console.error("Erreur lors du chargement du fichier de statistiques de l'utilisateur:", error);
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

  // Calcul du niveau et des pièces de monnaie
  const baseCoins = Math.max(
    1,
    Math.floor((Math.random() * message.content.length) / 10)
  );
  const randomCoins = Math.floor(Math.random() * 10) + 1;
  const userXP = userStats.coins || 0; // Utilisation du nombre de pièces comme expérience
  const userLevel = Math.floor(userXP / maxXP) + 1;

  // Mise à jour des pièces de monnaie
  const userId = message.author.id;
  const coinsPerMessage = baseCoins + randomCoins;
  userStats.coins =
    (userStats.coins || 0) + Math.min(coinsPerMessage, maxCoins);

  // Mise à jour de l'expérience et du niveau
  userStats.xp = userStats.coins || 0; // Mise à jour de l'expérience avec le nombre de pièces
  userStats.level = userLevel;

  // Écriture des données de l'utilisateur dans le fichier JSON
  fs.writeFileSync(
    `./stats/user_${userId}.json`,
    JSON.stringify(userStats, null, 4),
    (err) => {
      if (err) console.error("Erreur lors de l'enregistrement du fichier de statistiques de l'utilisateur:", err);
    }
  );

  console.log(
    `Utilisateur ${message.author.username}: Pièces - ${userStats.coins}, Niveau - ${userStats.level}`
  );
});





client.login(TOKEN);
