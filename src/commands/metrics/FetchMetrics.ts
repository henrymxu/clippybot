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

export default class Metrics extends Command {
    readonly config = new CommandConfigBuilder('metrics')
        .setDescriptions('Display server metrics regarding Clippy!')
        .setArguments(
            new StringArgumentBuilder('metric', 'The metric information to display.')
                .setChoices([
                    { name: 'Soundboard Usage', value: 'soundboard_usage'},
                ])
                .build()
        )
        .setExamples('metrics Soundboard Usage')
        .build();

    async execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        const commandName = args.get('metric') as string;
        const embed = new EmbedBuilder();
        switch (commandName) {
            case "soundboard_usage":
                const stats = await context.metrics.fetchSoundboardUsage();
                const soundboardInfos = context.config.getSoundboardSounds();
                embed.setTitle("Soundboard Usage")
                const fields = stats["soundboard_usage"].map(stat => {
                    const info = soundboardInfos.get(stat.id);
                    if (!info) {
                        return null
                    }
                    return {name: info.name, value: `${stat.usage}`}
                }).filter(it => it != null);
                embed.addFields(fields);
                break;
        }
        await replier.reply({embeds: [embed]});
    }
}
