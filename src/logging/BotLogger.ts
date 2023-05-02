import {Logger} from './Logger';

export class BotLogger implements Logger {
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
        console.error(`${tag}`, error instanceof Error ? error.message : error);
    }
}
