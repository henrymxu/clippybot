export class BotConfig {
    readonly config: any;

    constructor(argv) {
        // TODO: do more parsing
        this.config = argv;
    }

    has(...keys: string[]): boolean {
        return keys.map(it => this.get(it) !== undefined).reduce((left, right) => left && right);
    }

    get<T>(key: string): T | undefined {
        return this.config[key];
    }

    getNotNull<T>(key: string): T {
        return this.config[key];
    }

    getOrDefault<T>(key: string, defaultValue: T): T {
        return this.config[key] || defaultValue;
    }
}
