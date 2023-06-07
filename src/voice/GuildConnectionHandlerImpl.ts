import {GuildContext} from '../context/GuildContext';
import {GuildConnectionHandler} from './GuildConnectionHandler';
import {User, VoiceBasedChannel} from 'discord.js';
import {
    AudioReceiveStream, EndBehaviorType,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus
} from '@discordjs/voice';
import RecordingStream from '../utils/RecordingStream';
import {AudioUtils} from '../utils/AudioUtils';
import {Transform} from 'stream';
import MergingStream from '../utils/MergingStream';
import {CachingStream} from '../utils/CachingStream';
import {BotContext} from '../context/BotContext';

const TAG = "GuildConnectionHandlerImpl";

const NO_USER_TIMEOUT = 60 * 1000; // 1 Minute?

export class GuildConnectionHandlerImpl implements GuildConnectionHandler {
    private context: GuildContext;
    private readonly voiceStreams: Map<string, RecordingStream> = new Map();
    private readonly opusDecoderStreamReferences: Map<string, Transform> = new Map();
    private readonly mergeStream: MergingStream = new MergingStream(this.voiceStreams);

    private emptyVoiceChannelTimeout: NodeJS.Timeout | undefined;

    channelId: string | null = null;

    constructor(context: GuildContext) {
        this.context = context;
    }

    private getVoiceConnection(): VoiceConnection | undefined {
        return getVoiceConnection(this.context.guild.id);
    }

    registerVoiceStreamForUser(user?: User) {
        if (!user || user.bot) {
            return;
        }
        this.context.logger.i(TAG, `Registering voice stream for ${user}`);
        const stream = this.getVoiceConnection()?.receiver?.subscribe(
            user.id, {end: {behavior: EndBehaviorType.Manual}}
        );
        if (!stream) {
            return;
        }
        this.startVoiceStreamForUser(user, stream);
        if (this.emptyVoiceChannelTimeout) clearTimeout(this.emptyVoiceChannelTimeout);
    }

    unregisterVoiceStreamForUser(user?: User) {
        if (!user) {
            return;
        }
        this.removeVoiceStreamForUser(user);
        if (this.hasNoActiveVoiceStreams()) {
            this.context.logger.d(TAG, 'Starting no registered user timeout');
            this.emptyVoiceChannelTimeout = setTimeout(async () => {
                this.context.logger.d(TAG, 'Completed no registered user timeout');
                await this.disconnect();
            }, NO_USER_TIMEOUT);
        }
    }

    getAllVoiceStreamUserIds(): Map<string, boolean> {
        let subscriptionKeys = new Set(this.getVoiceConnection()?.receiver?.subscriptions.keys() ?? []);
        let streamKeys = new Set(this.voiceStreams.keys());

        let map = new Map<string, boolean>();

        streamKeys.forEach((key) => {
            map.set(key, subscriptionKeys.has(key));
        })
        return map;
    }

    getVoiceStreamForUser(user: User): CachingStream | undefined {
        return this.voiceStreams.get(user.id);
    }

    getMergedVoiceStream(): CachingStream | undefined {
        return this.context.config.doesSupportMergeStream() ? this.mergeStream : undefined;
    }

    disconnect(): Promise<boolean> {
        const result = this.getVoiceConnection()?.disconnect();
        this.getVoiceConnection()?.destroy(true);
        return Promise.resolve(result ?? false);
    }

    join(voiceChannel?: VoiceBasedChannel): Promise<VoiceConnection> {
        if (!voiceChannel || !voiceChannel.joinable) {
            return Promise.reject('Unable to join voice channel');
        }

        if (voiceChannel.id == this.context.guild.afkChannelId) {
            return Promise.reject('Not going to join the afk voice channel');
        }

        if (this.emptyVoiceChannelTimeout) clearTimeout(this.emptyVoiceChannelTimeout);
        this.getVoiceConnection()?.destroy(true);
        this.channelId = voiceChannel.id;

        const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true,
                debug: true,
            }
        );

        this.context.joinedVoiceChannel(connection);

        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            let userCount = 0;
            voiceChannel?.members?.forEach((value, key) => {
                if (key != BotContext.get().getSelfId()) {
                    this.registerVoiceStreamForUser(value.user);
                    userCount++;
                }
            });
            this.context.logger.i(TAG, `Connected to ${voiceChannel.id}, registering ${userCount} voice streams`);
        });

        connection.on('stateChange', (oldState, newState) => {
            switch (newState.status) {
                case VoiceConnectionStatus.Disconnected:
                case VoiceConnectionStatus.Destroyed: {
                    this.context.logger.d(
                        TAG, `VoiceConnection State Changed: ${newState.status} | ${this.channelId}`
                    );
                    this.reset();
                    this.channelId = null;
                }
            }
        });

        connection.on('error', error => {
            this.context.logger.e(TAG, `VoiceConnection Error: ${error}`);
        });

        return Promise.resolve(connection);
    }

    reset() {
        this.voiceStreams.clear();
        if (this.emptyVoiceChannelTimeout) {
            clearTimeout(this.emptyVoiceChannelTimeout);
        }

        this.opusDecoderStreamReferences.forEach(stream => {
            stream?.destroy();
        })
        this.opusDecoderStreamReferences.clear();
    }

    hasNoActiveVoiceStreams(): boolean {
        return this.voiceStreams.size == 0;
    }

    private startVoiceStreamForUser(user: User, sourceStream: AudioReceiveStream) {
        const decodedAudioStream = AudioUtils.createOpusDecodingStream();

        sourceStream.pipe(decodedAudioStream).on('error', err => {
            this.context.logger.e(TAG, `Error decoding stream. Unable to listen to ${user}. Error: ${err}`);
            sourceStream.removeAllListeners();
            sourceStream.destroy();
            decodedAudioStream.destroy();
        });

        this.opusDecoderStreamReferences.set(user.id, decodedAudioStream);

        const maxBufferSize = this.context.config.getMaxBufferSize();
        // To support merge streams, we need to have a silent stream
        const supportMergeStream = this.context.config.doesSupportMergeStream();

        // previousStream || new RecordingStream(maxBufferSize, supportMergeStream);
        const recorderStream = new RecordingStream(maxBufferSize, supportMergeStream)

        decodedAudioStream.pipe(recorderStream, {end: false});
        this.voiceStreams.set(user.id, recorderStream);
    }

    private removeVoiceStreamForUser(user: User) {
        const userLeftHandler = () => {
            this.context.logger.d(TAG, `Removing voice stream for ${user}`);
            this.voiceStreams.get(user.id)?.destroy();
            this.voiceStreams.delete(user.id);

            this.opusDecoderStreamReferences.get(user.id)?.destroy();
            this.opusDecoderStreamReferences.delete(user.id);
        }
        userLeftHandler();
    }
}
