import {Guild, VoiceState} from 'discord.js';
import {BotContext} from '../context/BotContext';

export default class LifecycleUtils {
    static updateIsAboutSelf(context: BotContext, voiceState: VoiceState): boolean {
        return voiceState?.member?.user.id === context?.getSelfId();
    }

    static updateIsAboutSelfChannel(botChannelId: string | null, state: VoiceState): boolean {
        return botChannelId !== null && botChannelId === state.channelId;
    }

    static alreadyInSiblingVoiceChannel(context: BotContext, guild: Guild): boolean {
        try {
            guild.channels.cache.forEach(channel => {
                if (channel.isVoiceBased()) {
                    if (channel.members.has(context.getSelfId())) {
                        throw new Error();
                    }
                }
            });
        } catch {
            return true;
        }
        return false;
    }

    static userJoinedChannel(oldState: VoiceState, newState: VoiceState): boolean {
        return oldState.channel === null && newState.channel !== null;
    }

    static userLeftChannel(oldState: VoiceState, newState: VoiceState): boolean {
        return oldState.channel !== null && newState.channel === null;
    }

    static userChangedChannel(oldState: VoiceState, newState: VoiceState): boolean {
        if (!oldState.channel || !newState.channel) {
            return false;
        }
        return oldState.channel && newState.channel && oldState.channelId !== newState.channelId;
    }
}
