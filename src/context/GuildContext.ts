import {VoiceConnection} from '@discordjs/voice';
import {Guild, GuildTextBasedChannel} from 'discord.js';
import {GuildConnectionHandler} from '../voice/GuildConnectionHandler';
import {GuildConnectionHandlerImpl} from '../voice/GuildConnectionHandlerImpl';
import {GuildLogger} from '../logging/GuildLogger';
import {GuildConfig} from '../config/GuildConfig';

export class GuildContext {
    readonly guild: Guild;

    readonly config: GuildConfig;
    readonly logger: GuildLogger;

    readonly connectionHandler: GuildConnectionHandler;

    constructor(guild: Guild, config: GuildConfig) {
        this.guild = guild;
        this.logger = new GuildLogger(this);
        this.connectionHandler = new GuildConnectionHandlerImpl(this);
        this.config = config;
    }

    async initialize() {
        return;
    }

    joinedVoiceChannel(connection: VoiceConnection) {

    }

    async getDefaultTextChannel(): Promise<GuildTextBasedChannel | undefined> {
        const channelId = this.config.getDefaultTextChannel();
        if (channelId) {
            const channel = await this.guild.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
                return (channel as GuildTextBasedChannel) ?? undefined;
            }
        }
        return undefined;
    }
}
