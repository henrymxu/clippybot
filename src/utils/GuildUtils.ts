import {GuildContext} from '../context/GuildContext';

export default class GuildUtils {
    static createUserMentionString(userId: string): string {
        return `<@${userId}>`;
    }
    static createVoiceChannelMentionString(channelId: string | null): string {
        return `<#${channelId}>`;
    }

    static async getSoundboardEmojiString(
        context: GuildContext,
        emojiName: string | undefined,
        emojiId: string | undefined
    ): Promise<string> {
        let emoji: string = "unknown"
        if (emojiId) {
            emoji = (await context.guild.emojis.fetch(emojiId)).toString();
        } else if (emojiName) {
            emoji = emojiName;
        }
        return emoji
    }
}
