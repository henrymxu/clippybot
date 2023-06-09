import VoiceCommand from '../VoiceCommand';
import {
    CommandAck,
    CommandArguments,
    CommandExecutionError
} from '../Command';
import {GuildContext} from '../../context/GuildContext';
import {
    ActionRow, ActionRowBuilder,
    AttachmentBuilder, ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    User
} from 'discord.js';
import {CachingStream} from '../../utils/CachingStream';
import {AudioUtils} from '../../utils/AudioUtils';
import {CommandConfigBuilder} from '../arguments/CommandConfig';
import {StringArgumentBuilder} from '../arguments/StringArgument';
import {UserArgumentBuilder} from '../arguments/UserArgument';
import {CommandMessage, CommandReplier} from '../CommandReplier';

export default class ClipCommand extends VoiceCommand {
    readonly config = new CommandConfigBuilder('clip')
        .setDescriptions('Create a clip of what was just said!')
        .setArguments(
            new UserArgumentBuilder('user', 'User you would like to clip')
                .build(),
            new StringArgumentBuilder('caption', 'Name of clip')
                .isNotRequired()
                .build()
        )
        .setExamples('clip', 'clip @Eve -l 5 -c Eve Funny Clip')
        .build();

    async execute(
        context: GuildContext,
        member: GuildMember,
        args: CommandArguments,
        replier: CommandReplier
    ): Promise<CommandAck> {
        let stream: CachingStream;
        let author = "";
        const user = args.get('user') as User;

        if (user) {
            author = user.username;
            const userStream = context.connectionHandler.getVoiceStreamForUser(user);
            if (!userStream) {
                throw new CommandExecutionError(`No voice stream registered for ${user.tag}.`);
            }
            stream = userStream;
        } else {
            const channelId = context.connectionHandler.channelId ?? "";
            const channel = await context.guild.channels.fetch(channelId);
            author = channel?.name ?? "";
            if (context.connectionHandler.hasNoActiveVoiceStreams()) {
                throw new CommandExecutionError(`No voice streams registered in ${channel?.name}.`);
            }
            const mergeStream = context.connectionHandler.getMergedVoiceStream();
            if (!mergeStream) {
                throw new CommandExecutionError(`Channel level clipping not supported in this guild.`);
            }
            stream = mergeStream;
        }

        const caption = (args.get('caption') as string) || `Clip of ${author}`;
        await replier.deferReply();

        try {
            const buffer = await AudioUtils.convertBufferToMp3Buffer(stream.getCachedBuffer(), caption, author);
            const response = this.createMessage(buffer, caption);

            return replier.editReply(response);
        } catch (err) {
            throw new CommandExecutionError(
                `There was an error converting Wav Buffer to MP3 Buffer, reason: ${err.toString()}`
            );
        }
    }

    private createMessage(buffer: Buffer, caption: string, includeDeleteButton: boolean = true): CommandMessage {
        const file = new AttachmentBuilder(buffer, {name: `${caption}.mp3`});
        const embed = new EmbedBuilder();
        embed.setTitle(caption);

        const requestDeleteButton = new ButtonBuilder()
            .setCustomId("request_delete")
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger)

        const row = new ActionRowBuilder()
            .addComponents(requestDeleteButton);

        const components = includeDeleteButton ? [row] : [];
        // TODO: support delete button request
        // @ts-ignore
        return { files: [file] }
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return true;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }

    override botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true;
    }
}
