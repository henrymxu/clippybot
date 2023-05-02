export interface Logger {
    d(tag: string, log: string);
    i(tag: string, log: string);
    w(tag: string, log: string);
    e(tag: string, error: Error | string);
}
