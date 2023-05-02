import {UserConfig} from './UserConfig';
import {GuildConfig} from './GuildConfig';

export class UserConfigImpl implements UserConfig {
    private readonly guildConfig: GuildConfig;
    private readonly userConfig: any;

    constructor(guildConfig: GuildConfig, userConfig: any | undefined) {
        this.guildConfig = guildConfig;
        if (!this.userConfig) {
            this.userConfig = {

            };
        }
        this.userConfig = userConfig;
    }
}
