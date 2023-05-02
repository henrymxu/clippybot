import {GuildConfig} from '../config/GuildConfig';

export interface DataSource {
    getGuildConfig(id: string): Promise<GuildConfig>
    saveGuildConfig(id: string, config: any): Promise<any>
}
