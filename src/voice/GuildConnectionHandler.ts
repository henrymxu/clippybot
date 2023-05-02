import {User, VoiceBasedChannel} from 'discord.js';
import {CachingStream} from '../utils/CachingStream';
import {VoiceConnection} from '@discordjs/voice';

export interface GuildConnectionHandler {
    channelId: string | null;

    join(voiceChannel: VoiceBasedChannel | null | undefined): Promise<VoiceConnection>;
    disconnect(): Promise<boolean>;

    reset();

    hasNoActiveVoiceStreams(): boolean;

    registerVoiceStreamForUser(user?: User);
    unregisterVoiceStreamForUser(user?: User);

    getVoiceStreamForUser(user: User): CachingStream | undefined;
    getMergedVoiceStream(): CachingStream | undefined;
}
