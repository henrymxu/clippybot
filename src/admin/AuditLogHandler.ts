import {BotContext} from '../context/BotContext';
import {Guild, GuildAuditLogsEntry} from 'discord.js';
import {GuildContext} from '../context/GuildContext';
import GuildUtils from '../utils/GuildUtils';

export async function handleAuditLogEvent(botContext: BotContext, guild: Guild, auditLog: GuildAuditLogsEntry) {
    const guildContext = await botContext.retrieveGuildContext(guild.id);
    let message: string | null = null;
    switch (auditLog.action) {
        // @ts-ignore
        case 132:
            message = await handleSoundboardDelete(guildContext, auditLog);
            break;
    }

    if (message != null) {
        guildContext.logger.i("AuditLogHandler", message!!);
    }
}

async function handleSoundboardDelete(guildContext: GuildContext, auditLog: GuildAuditLogsEntry): Promise<string | null> {
    const user = auditLog.executor;
    if (!user) {
        return null
    }
    const name = auditLog.changes.find(it => it.key == 'name')?.old;
    // @ts-ignore
    const emojiName: string | undefined = auditLog.changes.find(it => it.key == 'emoji_name')?.old;
    // @ts-ignore
    const emojiId: string | undefined = auditLog.changes.find(it => it.key == 'emoji_id')?.old;
    // @ts-ignore
    const makerId: string = auditLog.changes.find(it => it.key == 'user_id')?.old;
    const emoji = await GuildUtils.getSoundboardEmojiString(guildContext, emojiName, emojiId)
    // TODO: add metrics on usage before deletion
    return `${GuildUtils.createUserMentionString(user.id)} deleted soundboard clip ${emoji}: ${name} made by ${GuildUtils.createUserMentionString(makerId)}`;
}
