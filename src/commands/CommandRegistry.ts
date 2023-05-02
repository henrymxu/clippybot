import {Command} from './Command';
import {CommandRegistryResult} from './CommandRegistryImpl';

export interface CommandRegistry {
    getCommandForName(
        keyword: string,
        subcommandName?: string | null,
        subcommandGroupName?: string | null
    ): CommandRegistryResult | undefined

    getCommandForButton(id: string): CommandRegistryResult | undefined

    getCommandForKeyword(keyword: string): Command | undefined

    getCommandKeywords(): {name: string, value: string}[]
}
