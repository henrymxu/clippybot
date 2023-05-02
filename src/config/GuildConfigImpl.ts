import {GuildConfig} from './GuildConfig';
import {UserConfig} from './UserConfig';
import {UserConfigImpl} from './UserConfigImpl';

export class GuildConfigImpl implements GuildConfig {
    private readonly config: any;

    constructor(config: any) {
        this.config = config;
    }

    getDefaultTextChannel(): string | undefined {
        return this.config.defaultTextChannel;
    }

    setDefaultTextChannel(channelId: string) {
        this.config.defaultTextChannel = channelId;
    }

    getUserConfig(userId:string): UserConfig {
        const settings = this.config.userSettings[userId];
        return new UserConfigImpl(this, settings);
    }

    getMaxBufferSize(): number {
        return 500;
    }

    doesSupportMergeStream(): boolean {
        return false;
    }
}

