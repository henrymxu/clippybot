import {GuildConfig} from '../config/GuildConfig';
import {GuildConfigImpl} from '../config/GuildConfigImpl';
import {DataSource} from './DataSource';
import Keyv from 'keyv';

export class LocalDataSource implements DataSource {
    private readonly config = {
        defaultTextChannel: '',
        userSettings: {
        }
    };

    private keyStore: Keyv;

    constructor(path: string | undefined) {
        console.log(`Initializing KVStore Database with: ${path}`);
        this.keyStore = new Keyv(path);
    }

    async getGuildConfig(id: string): Promise<GuildConfig> {
        const json = this.keyStore.get(id);
        return new GuildConfigImpl(json);
    }

    saveGuildConfig(id: string, config: any): Promise<any> {
        return this.keyStore.set(id, config);
    }
}
