import {GuildConfigImpl} from './GuildConfigImpl';

describe('GuildConfig Language Testing', () => {
    test('GuildConfig getters', () => {
        const config = new GuildConfigImpl('0', {
            defaultTextChannel: '723339204838555649',
            defaultLanguage: 'en-US',
            userSettings: {

            }
        }, (a, b) => { return Promise.resolve({})});
        expect(config.getDefaultTextChannel()).toBe('723339204838555649');});
});
