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
import {StringArgumentBuilder} from '../arguments/StringArgument';
import {CommandReplier} from '../CommandReplier';
import GuildUtils from '../../utils/GuildUtils';

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
                const stats = await context.metrics.fetchSoundboardUsage(10);
                const soundboardInfos = context.config.getSoundboardSounds();
                embed.setTitle("Soundboard Usage")
                const promises = stats.stats.map(async (stat) => {
                    const info = soundboardInfos.get(stat.id);
                    if (!info) {
                        return null
                    }
                    const emoji = await GuildUtils.getSoundboardEmojiString(context, info.emoji_name, info.emoji_id)
                    const value = stat.topUsers.map(user => `${GuildUtils.createUserMentionString(user.id)}: ${user.count}`).join(', ')
                    return {name: `${emoji} ${info.name}: ${stat.usage}`, value: value}
                })
                const fields = await Promise.all(promises)
                embed.addFields(fields.filter((it): it is { name: string; value: string } => it !== null));
                break;
        }
        await replier.reply({embeds: [embed]});
    }
}
