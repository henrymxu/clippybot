import {VoiceState} from 'discord.js';
import LifecycleUtils from './LifecycleUtils';
import {BotContext} from '../context/BotContext';

const TAG = "LifecycleHandler"

export async function handleVoiceLifecycleEvent(botContext: BotContext, oldState: VoiceState, newState: VoiceState) {
    const guildContext = await botContext.retrieveGuildContext(newState.guild.id);
    const useAutoJoin = guildContext.config.getAutoJoinServer();

    if (LifecycleUtils.updateIsAboutSelf(botContext, newState)) {
        if (useAutoJoin && LifecycleUtils.userChangedChannel(oldState, newState) && oldState.channelId !== null) {
            guildContext.logger.d(TAG, `Moving channels from ${oldState.channelId} to ${newState.channelId}`);
            await guildContext.connectionHandler.join(newState.channel);
        } else if (LifecycleUtils.userLeftChannel(oldState, newState)) {
            // No need to handle anything here, connection handler will do it
            guildContext.logger.d(TAG, `Leaving channel ${oldState.channelId}`);
        }
    } else {
        const botChannelId = guildContext.connectionHandler.channelId;

        if (LifecycleUtils.userJoinedChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, newState)) {
                guildContext.logger.d(TAG, `${newState.member?.user.id} joined channel ${botChannelId}`);
                guildContext.connectionHandler.registerVoiceStreamForUser(newState.member?.user);
            } else if (useAutoJoin) {
                if (guildContext.connectionHandler.channelId == null) {
                    guildContext.logger.d(TAG,
                        `Joining ${newState.channelId} after not being in a channel`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                } else if (guildContext.connectionHandler.hasNoActiveVoiceStreams()) {
                    guildContext.logger.d(TAG,
                        `Leaving current empty channel ${botChannelId} for new channel ${newState.channelId}`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                }
            }
        } else if (LifecycleUtils.userLeftChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, oldState)) {
                guildContext.logger.d(TAG, `${oldState.member?.user.id} left channel ${botChannelId}`);
                guildContext.connectionHandler.unregisterVoiceStreamForUser(oldState.member?.user);
            }
        } else if (LifecycleUtils.userChangedChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, oldState)) {
                guildContext.logger.d(TAG, `${oldState.member?.user.id} left the bots channels`);
                guildContext.connectionHandler.unregisterVoiceStreamForUser(oldState.member?.user);
                if (useAutoJoin && guildContext.connectionHandler.hasNoActiveVoiceStreams()) {
                    guildContext.logger.d(TAG,
                        `Leaving empty channel ${botChannelId} for new channel ${newState.channelId}`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                }
            } else if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, newState)) {
                guildContext.logger.d(TAG, `${newState.member?.user.id} moved to the bots channel`);
                guildContext.connectionHandler.registerVoiceStreamForUser(oldState.member?.user);
            }
        }
    }
}
