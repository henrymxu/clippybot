import {ChatInputCommandInteraction, MessageComponentInteraction, User} from 'discord.js';
import {GuildContext} from '../context/GuildContext';
import {BotContext} from '../context/BotContext';
import {CommandDispatcher} from './CommandDispatcher';
import {Command, CommandArguments} from './Command';
import {CommandReplier, SlashCommandReplier} from './CommandReplier';

const TAG = "CommandDispatcherImpl";

export class CommandDispatcherImpl implements CommandDispatcher {
    async handleSlashCommand(interaction: ChatInputCommandInteraction) {
        const botContext = BotContext.get();
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);
        const result = botContext.registry.getCommandForName(interaction.commandName, subcommand, subcommandGroup);

        if (!result) {
            // command doesn't exist
            botContext.logger.e(TAG, `Could not find command '${interaction.commandName}' || '${subcommand}'`);
            return;
        }

        if (!interaction.guildId) {
            botContext.logger.e(TAG, `Command was not executed from guild (couldn't find guildId)`);
            return;
        }

        const context = await botContext.retrieveGuildContext(interaction.guildId);
        const args = result.command.getArgsFromInteraction(interaction, result.keyword);
        const replier = new SlashCommandReplier(context, interaction);
        await this.handleGuildCommand(context, interaction.user, result.command, args, replier);
    }

    async handleButtonInteraction(interaction: MessageComponentInteraction) {
        const botContext = BotContext.get();
        const result = botContext.registry.getCommandForButton(interaction.customId);
        if (!result) {
            // command doesn't exist
            console.log(`couldnt find message interaction '${interaction.customId}'`);
            return;
        }

        if (!interaction.guildId) {
            console.log(`command was not from guild (couldn't find guildId)`);
            return;
        }

        console.log(`${interaction.customId} -> ${result.keyword}`);
    }

    private async handleGuildCommand(
        context: GuildContext,
        user: User,
        command: Command,
        args: CommandArguments,
        replier: CommandReplier
    ) {
        const member = await context.guild.members.fetch(user.id);
        context.logger.d(TAG, `Executing Command ${command.config.name} by ${member.id}`);
        await command.preExecute(context, member, replier);
        try {
            const result = await command.execute(context, member, args, replier);
            await command.onExecuteSucceeded(context, result, replier);
        } catch (e) {
            await command.onExecutedFailed(context, e, replier);
        }
    }
}
