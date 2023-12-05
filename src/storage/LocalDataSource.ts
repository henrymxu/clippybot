import {GuildConfig} from '../config/GuildConfig';
import {GuildConfigImpl} from '../config/GuildConfigImpl';
import {DataSource} from './DataSource';
import {GuildMetrics} from '../metrics/GuildMetrics';
import {GuildMetricsImpl} from '../metrics/GuildMetricsImpl';
import {Db, MongoClient} from 'mongodb';
import {BotContext} from '../context/BotContext';

// import default_config from '../../resources/default_guild_config.json';

const default_config = {
    defaultTextChannel: '',
    userSettings: {
    }
};

export class LocalDataSource implements DataSource {

    private readonly mongoClient: MongoClient | undefined;

    constructor(path: string | undefined) {
        console.log(`Initializing Mongo Database with a valid path: ${path !== undefined}`);

        if (path) {
            this.mongoClient = new MongoClient(path);
        }

        // since it is used as a callback
        this.saveGuildConfig = this.saveGuildConfig.bind(this);
    }

    async getGuildConfig(id: string): Promise<GuildConfig> {
        let config: any = default_config;
        if (this.mongoClient) {
            const document  = await this.mongoClient.db(`guild_${id}`)
                .collection(`configs`).findOne({ type: 'guild_config' })
            if (document) {
                config = document["config"];
            } else {
                BotContext.get().logger.w("LocalDataSource", `Could not find guild config for ${id}`)
                this.saveGuildConfig(id, config).then(result => {
                    BotContext.get().logger.i("LocalDataSource", `Wrote default config for ${id}`)
                }) // write it back (in case of default)
            }
        }
        return new GuildConfigImpl(id, config, this.saveGuildConfig);
    }

    saveGuildConfig(id: string, config: GuildConfig): Promise<any> {
        const newData = {
            guild_id: id,
            type: 'guild_config',
            config: config.getConfig()
        };
        let result: Promise<any> = Promise.resolve();
        if (this.mongoClient) {
            result = this.mongoClient.db(`guild_${id}`).collection(`configs`)
                .replaceOne({ type: `guild_config` }, newData, { upsert: true })
        }
        return result;
    }

    async getGuildMetrics(id: string): Promise<GuildMetrics> {
        let db: Db | undefined = undefined;
        if (this.mongoClient) {
            db = this.mongoClient.db(`guild_${id}`)
        }
        return new GuildMetricsImpl(db);
    }
}
