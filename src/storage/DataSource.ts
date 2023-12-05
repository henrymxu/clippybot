import {GuildConfig} from '../config/GuildConfig';
import {GuildMetrics} from '../metrics/GuildMetrics';

export interface DataSource {
    getGuildConfig(id: string): Promise<GuildConfig>
    saveGuildConfig(id: string, config: any): Promise<any>

    getGuildMetrics(id: string): Promise<GuildMetrics>
}
