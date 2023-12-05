import {GuildContext} from '../context/GuildContext';
import {VoiceBasedChannel} from 'discord.js';
import {BotContext} from '../context/BotContext';

/**
 *     user_id: '114947386333331458',
 *     sound_volume: 1,
 *     sound_id: '1156432905174794240',
 *     emoji: { name: '😳', id: null, animated: false },
 *     channel_id: '924105370773880875',
 *     animation_type: 1,
 *     animation_id: 0,
 *     guild_id: '116737488344580102'
 * @param guildContext
 * @param data
 */
export async function handleSoundboardEvent(guildContext: GuildContext, data) {
    const userId = data.user_id;
    const soundId = data.sound_id;
    const channelId = data.channel_id;

    const channel = await guildContext.guild.channels.fetch(channelId);
    const audience = (channel as VoiceBasedChannel).members.filter(member => member.id != BotContext.get().getSelfId()).size;

    guildContext.metrics.addSoundboardUsage(userId, soundId, audience);
}
