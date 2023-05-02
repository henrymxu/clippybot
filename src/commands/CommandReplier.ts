import {
    BaseMessageOptions,
    ChatInputCommandInteraction,
    Message,
    MessagePayload
} from 'discord.js';
import {GuildContext} from '../context/GuildContext';

export type CommandMessage = string | MessagePayload | BaseMessageOptions

export abstract class CommandReplier {
    private readonly context: GuildContext;
    abstract readonly textBasedSource: boolean;

    protected constructor(context: GuildContext) {
        this.context = context;
    }

    abstract deferReply(message?: CommandMessage);

    abstract editReply(message: CommandMessage): Promise<string | undefined>;

    abstract reply(message: CommandMessage): Promise<string | undefined>;

    protected abstract getMessageFromId(id: string): Promise<Message | undefined>;
}

export class SlashCommandReplier extends CommandReplier {
    readonly textBasedSource: boolean = true;
    readonly interaction: ChatInputCommandInteraction;

    constructor(context: GuildContext, interaction: ChatInputCommandInteraction) {
        super(context);
        this.interaction = interaction;
    }

    override async deferReply(message?: CommandMessage) {
        await this.interaction.deferReply();
    }

    override async editReply(message: CommandMessage): Promise<string | undefined> {
        const result = await this.interaction.editReply(message);
        return result.id;
    }

    override async reply(message: CommandMessage): Promise<string | undefined> {
        const result = await this.interaction.reply(message);
        return result.id;
    }

    override async getMessageFromId(id: string): Promise<Message | undefined> {
        const result = await this.interaction.channel?.messages.resolve(id);
        return result ? result : undefined;
    }
}
