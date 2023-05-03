import {VoiceState} from 'discord.js';
import LifecycleUtils from './LifecycleUtils';
import {BotContext} from '../context/BotContext';

const TAG = "LifecycleHandler"

export async function handleVoiceLifecycleEvent(botContext: BotContext, oldState: VoiceState, newState: VoiceState) {
    if (LifecycleUtils.updateIsAboutSelf(botContext, newState)) {
        const guildContext = await botContext.retrieveGuildContext(newState.guild.id);
        if (LifecycleUtils.userChangedChannel(oldState, newState) && oldState.channelId !== null) {
            BotContext.get().logger.d(TAG, `Moving channels from ${oldState.channelId} to ${newState.channelId}`);
            await guildContext.connectionHandler.join(newState.channel);
        } else if (LifecycleUtils.userLeftChannel(oldState, newState)) {
            BotContext.get().logger.d(TAG, "Leaving channel");
            await guildContext.connectionHandler.disconnect();
        }
    } else {
        const guildContext = await botContext.retrieveGuildContext(newState.guild.id);
        const botChannelId = guildContext.connectionHandler.channelId;

        if (LifecycleUtils.userJoinedChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, newState)) {
                botContext.logger.d(TAG, `${newState.member?.user.id} joined channel ${botChannelId}`);
                guildContext.connectionHandler.registerVoiceStreamForUser(newState.member?.user);
            } else {
                if (guildContext.connectionHandler.channelId == null) {
                    botContext.logger.d(TAG,
                        `Joining ${newState.channelId} after not being in a channel`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                } else if (guildContext.connectionHandler.hasNoActiveVoiceStreams()) {
                    botContext.logger.d(TAG,
                        `Leaving current empty channel ${botChannelId} for new channel ${newState.channelId}`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                }
            }
        } else if (LifecycleUtils.userLeftChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, oldState)) {
                botContext.logger.d(TAG, `${oldState.member?.user.id} left channel ${botChannelId}`);
                guildContext.connectionHandler.unregisterVoiceStreamForUser(oldState.member?.user);
            }
        } else if (LifecycleUtils.userChangedChannel(oldState, newState)) {
            if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, oldState)) {
                botContext.logger.d(TAG, `${oldState.member?.user.id} left the bots channels`);
                guildContext.connectionHandler.unregisterVoiceStreamForUser(oldState.member?.user);
                if (guildContext.connectionHandler.hasNoActiveVoiceStreams()) {
                    botContext.logger.d(TAG,
                        `Leaving empty channel ${botChannelId} for new channel ${newState.channelId}`
                    );
                    await guildContext.connectionHandler.join(newState.channel);
                }
            } else if (LifecycleUtils.updateIsAboutSelfChannel(botChannelId, newState)) {
                botContext.logger.d(TAG, `${newState.member?.user.id} moved to the bots channel`);
                guildContext.connectionHandler.registerVoiceStreamForUser(oldState.member?.user);
            }
        }
    }
}
