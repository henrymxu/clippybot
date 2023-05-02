import {BotContext} from './context/BotContext';
import { Client, Events, GatewayIntentBits} from 'discord.js';
import {BotConfig} from './config/BotConfig';

export function StartClippyBot(config: BotConfig) {
    // Create a new client instance
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

    // When the client is ready, run this code (only once)
    // We use 'c' for the event parameter to keep it separate from the already defined 'client'
    client.once(Events.ClientReady, c => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    // Log in to Discord with your client's token
    BotContext.initializeAndLogin(client, config).then(() => {
        BotContext.get().registerVoiceLifecycleObserver();
        BotContext.get().registerSlashCommandObserver();
    });
}
