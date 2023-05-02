export default class GuildUtils {
    static createUserMentionString(userId: string): string {
        return `<@${userId}>`;
    }

    static createVoiceChannelMentionString(channelId: string | null): string {
        return `<#${channelId}>`;
    }
}
