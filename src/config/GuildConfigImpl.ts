import {GuildConfig} from './GuildConfig';
import {UserConfig} from './UserConfig';
import {UserConfigImpl} from './UserConfigImpl';

export class GuildConfigImpl implements GuildConfig {
    private readonly id: string;
    private readonly config: any;
    private readonly save: (id: string, config: GuildConfig) => Promise<any>;

    constructor(id: string, config: any, save: (id: string, config: GuildConfig) => Promise<any>) {
        this.id = id;
        this.config = config;
        this.save = save;
    }

    getAutoJoinServer(): boolean {
        return true;
    }

    getAudioClipTtl(): number | undefined {
        return undefined;
    }

    getDefaultTextChannel(): string | undefined {
        return this.config.defaultTextChannel;
    }

    setDefaultTextChannel(channelId: string) {
        this.config.defaultTextChannel = channelId;
        this.save(this.id, this.config);
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

    getSoundboardSounds(): Map<string, any> {
        const result = new Map<string, any>();
        const sounds = this.config.soundboardSounds ?? {};
        sounds.forEach(sound => {
            result.set(sound['sound_id'], sound);
        })
        return result;
    }

    addSoundboardSound(sound: any) {
        let sounds = this.config.soundboardSounds;
        sounds.push(sound);
        this.config.soundboardSounds = sounds;
        this.save(this.id, this.config);
    }

    setSoundboardSounds(sounds: any[]) {
        this.config.soundboardSounds = sounds;
        this.save(this.id, this.config);
    }
}

