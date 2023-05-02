import {SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder} from 'discord.js';
import {CommandArgumentConfig, CommandArgumentType} from './ArgumentConfig';

export class CommandConfig {
    readonly useSubcommands: boolean;

    readonly name: string;
    readonly parent: string | undefined;
    readonly keywords: string[];
    readonly descriptions: string[];
    readonly arguments: CommandArgumentConfig<CommandArgumentType>[];
    readonly buttonIds: string[];

    constructor(
        name: string,
        parent: string | undefined,
        keywords: string[],
        descriptions: string[],
        args: CommandArgumentConfig<CommandArgumentType>[],
        buttonIds: string[],
        shouldUseSubCommands: boolean,
    ) {
        this.useSubcommands = shouldUseSubCommands;
        this.name = name;
        this.parent = parent;
        this.keywords = keywords;
        this.descriptions = descriptions;
        this.arguments = args;
        this.buttonIds = buttonIds;
    }

    registerCommandsToGroup(builder: SlashCommandBuilder) {
        if (this.useSubcommands) {
            const groupBuilder = new SlashCommandSubcommandGroupBuilder();
            groupBuilder.setName(this.name).setDescription('TBD');
            this.keywords.forEach((keyword, index) => {
                const subcommandBuilder = new SlashCommandSubcommandBuilder();
                this.addKeywordAsCommand(subcommandBuilder, index);
                groupBuilder.addSubcommand(subcommandBuilder);
            });
            builder.addSubcommandGroup(groupBuilder);
        } else {
            this.keywords.forEach((_, index) => {
                const subcommandBuilder = new SlashCommandSubcommandBuilder();
                this.addKeywordAsCommand(subcommandBuilder, index);
                builder.addSubcommand(subcommandBuilder);
            });
        }
    }

    asSlashCommands(): (SlashCommandBuilder)[] {
        if (this.useSubcommands) {
            const builder = new SlashCommandBuilder()
                .setName(this.name)
                .setDescription('TBD');
            this.keywords.map((_, index) => {
                builder.addSubcommand(option => {
                    this.addKeywordAsCommand(option, index);
                    return option;
                });
            });
            return [builder];
        } else {
            return this.keywords.map((_, index) => {
                const builder = new SlashCommandBuilder();
                this.addKeywordAsCommand(builder, index);
                return builder;
            });
        }
    }

    private addKeywordAsCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, index: number) {
        builder.setName(this.keywords[index])
            .setDescription(this.descriptions[index]);

        this.arguments.forEach(arg => {
            arg.addToBuilderAsOption(builder);
        });
    }
}

export class CommandConfigBuilder {
    private readonly name: string;
    private readonly keywords: string[];
    private parentGroup: string | undefined;
    private descriptions: string[];
    private arguments: CommandArgumentConfig<CommandArgumentType>[] = [];

    private buttonIds: string[] = [];
    private apartOfSubcommandGroup = false;
    private shouldUseSubcommands = false;

    constructor(name: string, ...keywords: string[]) {
        this.name = name;
        if (keywords.length === 0) {
            this.keywords = [name];
        } else {
            this.keywords = keywords;
        }
    }

    isGroup(): CommandConfigBuilder {
        this.shouldUseSubcommands = true;
        return this;
    }

    apartOfGroup(group: string): CommandConfigBuilder {
        this.parentGroup = group;
        this.apartOfSubcommandGroup = true;
        return this;
    }

    setDescriptions(...descriptions: string[]): CommandConfigBuilder {
        this.descriptions = descriptions;
        return this;
    }

    setArguments(...args: CommandArgumentConfig<CommandArgumentType>[]): CommandConfigBuilder {
        this.arguments = args;
        return this;
    }

    setThrottleRate(count: number, seconds: number): CommandConfigBuilder {
        return this;
    }

    setExamples(...examples: string[]) {
        return this;
    }

    setButtonIds(...ids: string[]) {
        this.buttonIds = ids;
        return this;
    }

    build(): CommandConfig {
        return new CommandConfig(
            this.name,
            this.parentGroup,
            this.keywords,
            this.descriptions,
            this.arguments,
            this.buttonIds,
            this.shouldUseSubcommands
        );
    }
}
