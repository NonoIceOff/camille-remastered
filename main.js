const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const clientId = '1005618783500644372';
const guildId = '1158387984253599826';
const TOKEN = 'MTAwNTYxODc4MzUwMDY0NDM3Mg.GwAvAH.HV1Ay_6JYbiVPXdS8AEbC20IQLZuole4eDxhtA';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Map();

const commandFolders = readdirSync(join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const commandsPath = join(__dirname, 'commands', folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const commands = Array.from(client.commands.values(), cmd => cmd.data.toJSON());


const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
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
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(TOKEN);
