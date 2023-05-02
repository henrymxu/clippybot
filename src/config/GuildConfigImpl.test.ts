import {GuildConfigImpl} from './GuildConfigImpl';

describe('GuildConfig Language Testing', () => {
    test('GuildConfig getters', () => {
        const config = new GuildConfigImpl({
            defaultTextChannel: '723339204838555649',
            defaultLanguage: 'en-US',
            userSettings: {

            }
        });
        expect(config.getDefaultTextChannel()).toBe('723339204838555649');});
});
