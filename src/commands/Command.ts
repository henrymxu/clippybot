import {GuildContext} from '../context/GuildContext';
import {
    ChatInputCommandInteraction,
    GuildMember,
    InteractionResponse,
} from 'discord.js';
import {CommandConfig} from './arguments/CommandConfig';
import {CommandArgumentType} from './arguments/ArgumentConfig';
import {CommandMessage, CommandReplier} from './CommandReplier';

export abstract class Command {
    abstract readonly config: CommandConfig;

    getArgsFromInteraction(interaction: ChatInputCommandInteraction, keyword: string): CommandArguments {
        const results = new Map<string, CommandArgumentType>;
        results.set('keyword', keyword);
        this.config.arguments.forEach(arg => {
            const parsedArg = arg.parseFromInteraction(interaction);
            if (!parsedArg) {
                return;
            }
            results.set(arg.key, parsedArg);
        });
        return results;
    }

    getArgsFromNonSlashCommand(keyword: string, message: string): CommandArguments {
        const results = new Map<string, CommandArgumentType>;
        results.set('keyword', keyword);
        const arg = this.config.arguments.find(arg => arg.voiceCommandPrioritized);
        if (arg) {
            results.set(arg.key, message);
        }
        return results;
    }

    abstract execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck>

    async onExecuteSucceeded(context: GuildContext, acknowledge: CommandAck, replier: CommandReplier) {
        // TODO
    }

    async onExecutedFailed(context: GuildContext, error: CommandExecutionError, replier: CommandReplier) {
        context.logger.e('CommandExecution', error);
        await replier.reply(error.message);
    }

    async preExecute(context: GuildContext, member: GuildMember, replier: CommandReplier): Promise<void> {
        // Implemented by child classes
        return Promise.resolve();
    }
}

export type CommandAck = InteractionResponse | CommandMessage | void;

export class CommandExecutionError extends Error {
    readonly emoji?: Acknowledgement;

    constructor(msg?: string, emoji?: Acknowledgement) {
        super(msg);
        this.emoji = emoji;
    }
}

export type CommandArguments = Map<string, CommandArgumentType>

export type Acknowledgement = string
