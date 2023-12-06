import {UserConfig} from './UserConfig';

export interface GuildConfig {
    getAutoJoinServer(): boolean

    setDefaultTextChannel(channelId: string)
    getDefaultTextChannel(): string | undefined

    getUserConfig(userId: string): UserConfig

    doesSupportMergeStream(): boolean;
    getMaxBufferSize(): number;

    getSoundboardSounds(): Map<string, any>;
    setSoundboardSounds(sounds: any[])
    addSoundboardSound(sound: any)
}
