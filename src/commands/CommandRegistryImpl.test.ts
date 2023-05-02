import {CommandRegistryImpl} from './CommandRegistryImpl';

describe('CommandRegistryImpl Test', () => {
    test('Get Command From Button Id', () => {
        const commandRegistry = new CommandRegistryImpl(
            __dirname
        );
        expect(commandRegistry.getCommandForButton("ask.retry")?.keyword).toBe("ask");
    });
});
