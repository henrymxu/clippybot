import {
    Command,
    CommandAck,
    CommandArguments
} from '../Command';
import {GuildContext} from '../../context/GuildContext';
import {
    EmbedBuilder,
    GuildMember
} from 'discord.js';
import {CommandConfigBuilder} from '../arguments/CommandConfig';
import {CommandReplier} from '../CommandReplier';
import GuildUtils from '../../utils/GuildUtils';
import EasyTable from 'easy-table';

export default class StatusCommand extends Command {
    readonly config = new CommandConfigBuilder('status')
        .setDescriptions('Display the current status of Clippy!')
        .setArguments(
        )
        .setExamples('status')
        .build();

    async execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        const registeredVoiceStreams = context.connectionHandler.getAllVoiceStreamUserIds();
        const tableData: {id: string, name: string}[] = [];

        registeredVoiceStreams.forEach(userId => {
            tableData.push({ id: userId, name: GuildUtils.createUserMentionString(userId)});
        });

        const table = new EasyTable();
        tableData.forEach(row => {
            table.cell('Active Users', row.name);
            table.newRow();
        })

        const embed = new EmbedBuilder();
        embed.setTitle('Clippy Status');
        embed.setDescription(table.toString());
        await replier.reply({embeds: [embed]});
    }
}
