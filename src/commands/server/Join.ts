import VoiceCommand from '../VoiceCommand';
import {CommandAck, CommandArguments} from '../Command';
import {GuildContext} from '../../context/GuildContext';
import {GuildMember} from 'discord.js';
import GuildUtils from '../../utils/GuildUtils';
import {CommandConfig, CommandConfigBuilder} from '../arguments/CommandConfig';
import {CommandReplier} from '../CommandReplier';

export default class JoinCommand extends VoiceCommand {
    readonly config: CommandConfig = new CommandConfigBuilder('join')
        .setDescriptions('Join voice channel')
        .build();

    execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        replier.reply(`Joined ${GuildUtils.createVoiceChannelMentionString(member.voice.channelId)}`);
        return Promise.resolve();
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
