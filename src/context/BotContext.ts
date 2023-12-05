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
import {handleAuditLogEvent} from '../admin/AuditLogHandler';
import {handleSoundboardEvent} from '../soundboard/SoundboardEventHandler';

export class BotContext {
    private static instance: BotContext | undefined;

    readonly client: Client;
    readonly config: BotConfig;
    private guilds: Map<string, GuildContext>;

    readonly dispatcher: CommandDispatcher;
    readonly registry: CommandRegistry = new CommandRegistryImpl(path.join(__dirname, '../commands'));
    readonly dataSource: DataSource;
    readonly logger: BotLogger;

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
        this.logger = new BotLogger();

        this.client = client;
        this.config = config;
        this.guilds = new Map<string, GuildContext>();
        this.dispatcher = new CommandDispatcherImpl();
        this.dataSource = new LocalDataSource(config.get('mongo_uri'));
    }

    async retrieveGuildContext(guildId: string): Promise<GuildContext> {
        let context = this.guilds.get(guildId);
        if (!context) {
            const guild = await this.client.guilds.fetch(guildId);

            const config = await this.dataSource.getGuildConfig(guildId);
            const metrics = await this.dataSource.getGuildMetrics(guildId);
            context = new GuildContext(guild, config, metrics);
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

    registerAuditLogObserver() {
        this.client.on(Events.GuildAuditLogEntryCreate, async (auditLog, guild) => {
            await handleAuditLogEvent(this, guild, auditLog)
        })
    }

    registerSoundboardObserver() {
        this.client.on(Events.Raw, async (data) => {
            if (data.t == 'VOICE_CHANNEL_EFFECT_SEND') {
                const guildContext = await this.retrieveGuildContext(data.d.guild_id);
                await handleSoundboardEvent(guildContext, data.d);
            } else if (data.t == 'GUILD_CREATE') {
                const guildId = data.d.id;
                const soundboard_sounds = data.d.soundboard_sounds;
                const guildContext = await this.retrieveGuildContext(guildId);
                guildContext.config.setSoundboardSounds(soundboard_sounds);
            } else if (data.t == 'GUILD_SOUNDBOARD_SOUND_CREATE') {
                const guildContext = await this.retrieveGuildContext(data.d.guild_id);
                guildContext.config.addSoundboardSound(data.d)
            }
        })
    }
}
