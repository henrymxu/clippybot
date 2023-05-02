import {Logger} from './Logger';
import {GuildContext} from '../context/GuildContext';

export class GuildLogger implements Logger {
    private context: GuildContext;

    constructor(context: GuildContext) {
        this.context = context;
    }

    d(tag: string, log: string) {
        console.debug(`${tag}: ${log}`);
    }

    i(tag: string, log: string) {
        console.info(`${tag}: ${log}`);
    }

    w(tag: string, log: string) {
        console.warn(`${tag}: ${log}`);
    }

    e(tag: string, error: Error | string) {
        console.error(
            `${tag} : ${error instanceof Error ? error.message : error} : ${error instanceof Error ? error.stack : error}`
        );
    }
}
