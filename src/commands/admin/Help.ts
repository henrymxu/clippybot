import {
    Command,
    CommandAck,
    CommandArguments, CommandExecutionError
} from '../Command';
import {GuildContext} from '../../context/GuildContext';
import {
    EmbedBuilder,
    GuildMember
} from 'discord.js';
import {CommandConfigBuilder} from '../arguments/CommandConfig';
import {StringArgumentBuilder} from '../arguments/StringArgument';
import {CommandReplier} from '../CommandReplier';
import {BotContext} from '../../context/BotContext';

export default class HelpCommand extends Command {
    readonly config = new CommandConfigBuilder('help')
        .setDescriptions('Display basic information about Clippy!')
        .setArguments(
            new StringArgumentBuilder('command', 'To display specific information about a command.')
                .isNotRequired()
                .setChoices([
                    // TODO: make this not hardcoded
                    { name: 'clip', value: 'clip'},
                    { name: 'join', value: 'join'},
                    { name: 'leave', value: 'leave'}
                ])
                .build()
        )
        .setExamples('help', 'help clip')
        .build();

    async execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        const commandName = args.get('command') as string;
        if (commandName) {
            const command = BotContext.get().registry.getCommandForKeyword(commandName);
            if (!command) {
                throw new CommandExecutionError(`Command ${commandName} not found!`);
            }
            const embed = new EmbedBuilder();
            embed.setTitle(`Help for ${command.config.name}`);
            embed.setDescription(command.config.descriptions[0]);
            await replier.reply({embeds: [embed]});
        } else {
            const embed = new EmbedBuilder();
            const text = "Clippy is a bot that can create audio clips from users. To get started, use the join" +
                " command then the clip command! For help relating to a command, try the help command followed" +
                " by a command name.";
            embed.setDescription(text);
            await replier.reply({embeds: [embed]});
        }
    }
}
