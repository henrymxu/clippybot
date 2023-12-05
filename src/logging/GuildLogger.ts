import {Logger} from './Logger';
import {GuildContext} from '../context/GuildContext';
import {ColorResolvable, EmbedBuilder} from 'discord.js';

export class GuildLogger implements Logger {
    private context: GuildContext;

    constructor(context: GuildContext) {
        this.context = context;
    }

    private sendChannelMessage(color: ColorResolvable, tag: string, log: string) {
        this.context.getDefaultTextChannel().then(channel => {
            const builder = new EmbedBuilder();
            builder.setTitle(tag);
            builder.setDescription(log);
            builder.setColor(color);
            channel?.send({ embeds: [builder] });
        })
    }

    d(tag: string, log: string) {
        console.debug(`${tag}: ${log}`);
        this.sendChannelMessage("#3232f7", tag, log)
    }

    i(tag: string, log: string) {
        console.info(`${tag}: ${log}`);
        this.sendChannelMessage("#ffffff", tag, log)
    }

    w(tag: string, log: string) {
        console.warn(`${tag}: ${log}`);
        this.sendChannelMessage("#f0ff1e", tag, log)
    }

    e(tag: string, error: Error | string) {
        const message = `${error instanceof Error ? error.message : error} : ${error instanceof Error ? error.stack : error}`
        console.error(
            `${tag} : ${message}`
        );
        this.sendChannelMessage("#ff0000", tag, message)
    }
}
