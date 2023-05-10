import {UserConfig} from './UserConfig';

export interface GuildConfig {
    getAutoJoinServer(): boolean

    setDefaultTextChannel(channelId: string)
    getDefaultTextChannel(): string | undefined

    getUserConfig(userId: string): UserConfig

    doesSupportMergeStream(): boolean;
    getMaxBufferSize(): number;
}
