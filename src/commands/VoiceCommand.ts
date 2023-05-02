import {Command, CommandExecutionError} from './Command';
import {GuildContext} from '../context/GuildContext';
import {GuildMember, VoiceBasedChannel} from 'discord.js';
import {CommandReplier} from './CommandReplier';

export default abstract class VoiceCommand extends Command {
    abstract botMustBeInTheSameVoiceChannel(): boolean;

    abstract botMustAlreadyBeInVoiceChannel(): boolean;

    abstract userMustBeInVoiceChannel(): boolean;

    protected botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return false;
    }

    override preExecute(context: GuildContext, member: GuildMember, replier: CommandReplier): Promise<void> {
        const status = this.checkBotVoiceChannelStatus(context, member, replier);
        if (status === Status.READY) {
            return Promise.resolve();
        }
        if (status === Status.NEEDS_JOIN) {
            if (this.botShouldNotJoinVoiceChannelIfNotReady()) {
                return Promise.reject(
                    new CommandExecutionError(
                        'Bot must already be in the voice channel before this command is requested'
                    )
                );
            } else {
                return this.joinVoiceChannel(context, member);
            }
        }
        return Promise.reject(new CommandExecutionError('Bot is not ready to perform this voice command'));
    }

    protected checkBotVoiceChannelStatus(context: GuildContext, member: GuildMember, replier: CommandReplier): Status {
        if (!replier.textBasedSource) {
            return Status.READY; // Implies already in a voice channel (command was executed from non text channel)
        }
        const guildId = context.guild?.id;
        if (!guildId) {
            return Status.INVALID;
        }
        const userVoiceChannel = member.voice.channel || undefined;
        const botVoiceChannelId = context.connectionHandler.channelId;
        if (this.userMustBeInVoiceChannel() && !userVoiceChannel) {
            // Logger.w(VoiceCommand.name, `${message.member?.user.tag} was not in voice channel`, context);
            return Status.INVALID;
        }
        if (this.botMustAlreadyBeInVoiceChannel() && !botVoiceChannelId) {
            // Logger.w(VoiceCommand.name, 'Bot was not already in voice channel', context);
            return Status.INVALID;
        }
        if (this.botMustBeInTheSameVoiceChannel()) {
            if (!userVoiceChannel || !botVoiceChannelId || userVoiceChannel.id !== botVoiceChannelId) {
                context.logger.w(
                    VoiceCommand.name,
                    `Bot was not in the same voice channel as user`
                );
                return Status.INVALID;
            }
        }
        if (isAlreadyInVoiceChannel(context, userVoiceChannel)) {
            return Status.READY;
        }
        return Status.NEEDS_JOIN;
    }

    protected async joinVoiceChannel(context: GuildContext, member: GuildMember): Promise<void> {
        try {
            await context.connectionHandler.join(member.voice?.channel);
        } catch (e) {
            throw new CommandExecutionError(`Error joining voice channel: ${e}`);
        }
    }
}

export enum Status {
    READY,
    NEEDS_JOIN,
    INVALID,
}

function isAlreadyInVoiceChannel(context: GuildContext, voiceChannel: VoiceBasedChannel | undefined): boolean {
    return voiceChannel !== undefined && voiceChannel?.id === context.connectionHandler.channelId;
}
