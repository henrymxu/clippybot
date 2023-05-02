import {UserConfig} from './UserConfig';

export interface GuildConfig {
    setDefaultTextChannel(channelId: string)
    getDefaultTextChannel(): string | undefined

    getUserConfig(userId: string): UserConfig

    doesSupportMergeStream(): boolean;
    getMaxBufferSize(): number;
}
