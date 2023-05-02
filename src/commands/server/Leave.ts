import VoiceCommand from '../VoiceCommand';
import {CommandAck, CommandArguments} from '../Command';
import {GuildContext} from '../../context/GuildContext';
import {GuildMember} from 'discord.js';
import GuildUtils from '../../utils/GuildUtils';
import {CommandConfig, CommandConfigBuilder} from '../arguments/CommandConfig';
import {CommandReplier} from '../CommandReplier';

export default class LeaveCommand extends VoiceCommand {
    readonly config: CommandConfig = new CommandConfigBuilder('leave')
        .setDescriptions('Leave voice channel')
        .build();

    execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        return context.connectionHandler.disconnect().then(() => {
            return replier.reply(`Left ${GuildUtils.createVoiceChannelMentionString(member.voice.channelId)}`);
        });
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return false;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }
}
