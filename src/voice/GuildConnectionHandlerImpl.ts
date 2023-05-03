import {GuildContext} from '../context/GuildContext';
import {GuildConnectionHandler} from './GuildConnectionHandler';
import {User, VoiceBasedChannel} from 'discord.js';
import {
    AudioReceiveStream,
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
const USER_REJOIN_THRESHOLD = 15000;

export class GuildConnectionHandlerImpl implements GuildConnectionHandler {
    private context: GuildContext;
    private activeVoiceStreamCount = 0;
    private readonly voiceStreams: Map<string, RecordingStream> = new Map();
    private readonly opusDecoderStreamReferences: Map<string, Transform> = new Map();
    private readonly mergeStream: MergingStream = new MergingStream(this.voiceStreams);

    private emptyVoiceChannelTimeout: NodeJS.Timeout | undefined;
    private readonly userRemovedTimeouts: Map<string, NodeJS.Timeout> = new Map();

    channelId: string | null = null;

    constructor(context: GuildContext) {
        this.context = context;
    }

    private getVoiceConnection(): VoiceConnection | undefined {
        return getVoiceConnection(this.context.guild.id);
    }

    registerVoiceStreamForUser(user?: User) {
        if (!user) {
            return;
        }
        this.context.logger.i(TAG, `Registering voice stream for ${user}`);
        const stream = this.getVoiceConnection()?.receiver?.subscribe(user.id);
        if (!stream) {
            return;
        }
        this.activeVoiceStreamCount++;
        this.startVoiceStreamForUser(user, stream);
        if (this.emptyVoiceChannelTimeout) clearTimeout(this.emptyVoiceChannelTimeout);
    }

    unregisterVoiceStreamForUser(user?: User) {
        if (!user) {
            return;
        }
        this.removeVoiceStreamForUser(user);
        this.activeVoiceStreamCount--;
        if (this.hasNoActiveVoiceStreams()) {
            this.context.logger.d(TAG, 'Starting no registered user timeout');
            this.emptyVoiceChannelTimeout = setTimeout(async () => {
                await this.disconnect();
            }, NO_USER_TIMEOUT);
        }
    }

    getAllVoiceStreamUserIds(): Set<string> {
        return new Set(this.voiceStreams.keys());
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
            this.context.logger.i(TAG, `Connected to ${voiceChannel.id}`);
            voiceChannel?.members?.forEach((value, key) => {
                if (key != BotContext.get().getSelfId()) {
                    this.registerVoiceStreamForUser(value.user);
                }
            });
        });

        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        };

        connection.on('stateChange', (oldState, newState) => {
            // if (oldState.status === VoiceConnectionStatus.Ready &&
            //     newState.status === VoiceConnectionStatus.Connecting) {
            //     BotContext.get().logger.d(TAG, `Configuring Networking`);
            // }
            // const oldNetworking = Reflect.get(oldState, 'networking');
            // const newNetworking = Reflect.get(newState, 'networking');
            // oldNetworking?.off('stateChange', networkStateChangeHandler);
            // newNetworking?.on('stateChange', networkStateChangeHandler);
            switch (newState.status) {
                case VoiceConnectionStatus.Disconnected:
                case VoiceConnectionStatus.Destroyed: {
                    this.context.logger.d(
                        TAG, `VoiceConnection State Changed: ${newState.status} | ${this.channelId}`
                    );
                    this.reset();
                    break;
                }
            }
        });

        connection.on('error', error => {
            this.context.logger.e(TAG, `VoiceConnection Error: ${error}`);
        });

        return Promise.resolve(connection);
    }

    reset() {
        this.activeVoiceStreamCount = 0;
        this.voiceStreams.clear();
        this.userRemovedTimeouts.forEach((timeout: NodeJS.Timeout) => {
            clearTimeout(timeout);
        });
        this.userRemovedTimeouts.clear();
        this.opusDecoderStreamReferences.forEach(stream => {
            stream.destroy();
        })
        this.opusDecoderStreamReferences.clear();
        this.channelId = null;
    }

    hasNoActiveVoiceStreams(): boolean {
        return this.activeVoiceStreamCount === 0;
    }

    private startVoiceStreamForUser(user: User, sourceStream: AudioReceiveStream) {
        const decodedAudioStream = AudioUtils.createOpusDecodingStream();

        sourceStream.pipe(decodedAudioStream).on('error', err => {
            this.context.logger.e(TAG, `Error decoding stream. Unable to listen to ${user}. Error: ${err}`);
            sourceStream.removeAllListeners();
            sourceStream.destroy();
            decodedAudioStream.destroy();
            return;
        });

        const maxBufferSize = this.context.config.getMaxBufferSize();

        // To support merge streams, we need to have a silent stream
        const supportMergeStream = this.context.config.doesSupportMergeStream();

        this.opusDecoderStreamReferences.set(user.id, decodedAudioStream);

        const previousStream = this.voiceStreams.get(user.id);
        const recorderStream = previousStream || new RecordingStream(maxBufferSize, supportMergeStream);

        decodedAudioStream.pipe(recorderStream, {end: false});
        this.voiceStreams.set(user.id, recorderStream);
    }

    private removeVoiceStreamForUser(user: User, forceLeave = false) {
        const timeout = setTimeout(
            () => {
                this.context.logger.d(TAG, `Removing voice stream for ${user}`);
                this.voiceStreams.delete(user.id);
                this.opusDecoderStreamReferences.get(user.id)?.destroy();
                this.opusDecoderStreamReferences.delete(user.id);
                this.userRemovedTimeouts.delete(user.id);
            },
            forceLeave ? 0 : USER_REJOIN_THRESHOLD
        );
        this.userRemovedTimeouts.set(user.id, timeout);
        this.voiceStreams.get(user.id)?.end();
    }
}
