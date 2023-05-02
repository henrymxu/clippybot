import * as path from 'path';
import {Client, Events} from 'discord.js';
import {GuildContext} from './GuildContext';
import {BotLogger} from '../logging/BotLogger';
import {CommandRegistry} from '../commands/CommandRegistry';
import {CommandRegistryImpl} from '../commands/CommandRegistryImpl';
import {CommandDispatcher} from '../commands/CommandDispatcher';
import {CommandDispatcherImpl} from '../commands/CommandDispatcherImpl';
import {handleVoiceLifecycleEvent} from '../lifecycle/LifecycleHandler';
import {LocalDataSource} from '../storage/LocalDataSource';
import {DataSource} from '../storage/DataSource';
import {BotConfig} from '../config/BotConfig';

export class BotContext {
    private static instance: BotContext | undefined;

    readonly client: Client;
    readonly config: BotConfig;
    private guilds: Map<string, GuildContext>;

    readonly dispatcher: CommandDispatcher;
    readonly registry: CommandRegistry = new CommandRegistryImpl(path.join(__dirname, '../commands'));
    readonly dataSource: DataSource;
    readonly logger = new BotLogger();

    static initialize(client: Client, config: BotConfig) {
        this.instance = new BotContext(client, config);
    }

    static initializeAndLogin(client: Client, config: BotConfig): Promise<string> {
        BotContext.initialize(client, config);
        return client.login(config.get('discord_token'));
    }

    static get(): BotContext {
        if (!this.instance) {
            throw new Error("BotContext must be initialized at startup");
        }
        return this.instance;
    }

    constructor(client: Client, config: BotConfig) {
        this.client = client;
        this.config = config;
        this.guilds = new Map<string, GuildContext>();
        this.dispatcher = new CommandDispatcherImpl();
        this.dataSource = new LocalDataSource(config.get('database_path'));
    }

    async retrieveGuildContext(guildId: string): Promise<GuildContext> {
        let context = this.guilds.get(guildId);
        if (!context) {
            const guild = await this.client.guilds.fetch(guildId);

            const config = await this.dataSource.getGuildConfig(guildId);
            context = new GuildContext(guild, config);
            this.guilds.set(guildId, context);
            await context.initialize();
        }
        return context;
    }

    getSelfId(): string {
        return this.client.user?.id ?? "Unable to fetch self Id";
    }

    registerSlashCommandObserver() {
        this.client.on(Events.InteractionCreate, interaction => {
            if (interaction.isChatInputCommand()) {
                this.dispatcher.handleSlashCommand(interaction);
            }
            if (interaction.isButton()) {
                this.dispatcher.handleButtonInteraction(interaction);
            }
        });
    }

    registerVoiceLifecycleObserver() {
        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            await handleVoiceLifecycleEvent(this, oldState, newState);
        });
    }
}
