import {Client, GatewayIntentBits, REST, Routes} from 'discord.js';
import {CommandRegistryImpl} from './commands/CommandRegistryImpl';
import * as path from 'path';
import {BotConfig} from './config/BotConfig';
import {BotContext} from './context/BotContext';

export async function Deploycommands(config: BotConfig) {
    const client = new Client({ intents: [] });
    BotContext.initialize(client, config);
    const registry = new CommandRegistryImpl(path.join(__dirname, 'commands'), true);
    const commands = registry.getSlashCommands().map(command => command.toJSON());

    try {
        // Construct and prepare an instance of the REST module
        const token: string = config.get('discord_token')!;
        const rest = new REST({ version: '10' }).setToken(token);
        const applicationId: string = config.get('application_id')!;
        // await rest.put(Routes.applicationCommands(applicationId), { body: [] });
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data: any = await rest.put(Routes.applicationCommands(applicationId), { body: commands });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}

export async function DeployGuildCommands(config: BotConfig, guildId: string) {
    const client = new Client({ intents: [] });
    BotContext.initialize(client, config);
    const registry = new CommandRegistryImpl(path.join(__dirname, 'commands'), true);
    const commands = registry.getSlashCommands(true).map(command => command.toJSON());

    try {
        // Construct and prepare an instance of the REST module
        const token: string = config.get('discord_token')!;
        const rest = new REST({ version: '10' }).setToken(token);
        const applicationId: string = config.get('application_id')!;
        // await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: [] });
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data: any = await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commands });
        console.log(`Successfully reloaded ${data.length} guild (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}

