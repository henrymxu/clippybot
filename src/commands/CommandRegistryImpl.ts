import RequireAll from 'require-all';
import {Command} from './Command';
import {CommandRegistry} from './CommandRegistry';
import VoiceCommand from './VoiceCommand';
import {SlashCommandBuilder} from 'discord.js';

export class CommandRegistryImpl implements CommandRegistry {
    readonly commands = new Map<string, Command>();
    readonly groups = new Set<string>();

    constructor(path: string, forSlashCommandRegistration = false) {
        this.registerCommandsIn(path, forSlashCommandRegistration);
    }

    getCommandForName(
        name: string,
        subcommandName: string | null,
        subcommandGroupName: string | null
    ): CommandRegistryResult | undefined {
        let command = this.commands.get(name.toLowerCase());
        if (command) {
            return {keyword: name, command: command};
        }
        if (subcommandName) {
            command = this.commands.get(subcommandName);
            if (command) {
                return {keyword: subcommandName, command: command};
            }
        }
        return undefined;
    }

    getCommandForButton(id: string): CommandRegistryResult | undefined {
        for (const [key, value] of this.commands.entries()) {
            if (value.config.buttonIds.includes(id)) {
                return { keyword: key, command: value };
            }
        }
        return undefined;
    }

    getCommandForKeyword(keyword: string): Command | undefined {
        return this.commands.get(keyword.toLowerCase());
    }

    getCommandKeywords(): {name: string, value: string}[] {
        return this.getSlashCommands().map(command => {
           return { name: command.name, value: command.name};
        });
    }

    getSlashCommands(): SlashCommandBuilder[] {
        const slashCommands: SlashCommandBuilder[] = [];
        const groupSlashCommandBuilders = new Map<string, SlashCommandBuilder>();

        this.commands.forEach(command => {
            if (command.config.parent) {
                const builder = groupSlashCommandBuilders.get(command.config.parent) || new SlashCommandBuilder();
                builder.setName(command.config.parent).setDescription('TBD');
                command.config.registerCommandsToGroup(builder);
                groupSlashCommandBuilders.set(command.config.parent, builder);
            } else {
                slashCommands.push(...command.config.asSlashCommands());
            }
        });

        // Add all the groups we created;
        groupSlashCommandBuilders.forEach(group => {
            slashCommands.push(group);
        });

        return slashCommands;
    }

    private registerCommandsIn(path: string, forSlashCommandRegistration: boolean) {
        const modules = RequireAll({
            dirname: path,
            filter: /^([^.]*)\.(ts|js)$/,
        });

        function getLeafNodes(nodes: object, result: any[] = []): any[] {
            Object.values(nodes).forEach(node => {
                if (node.default) {
                    result.push(node);
                    return;
                } else if (typeof node === 'object') {
                    result = getLeafNodes(node, result);
                }
            });
            return result;
        }

        Object.values(getLeafNodes(modules)).forEach((command: any) => {
            if (CommandRegistryImpl.isCommand(command)) {
                const instance: Command = new command.default();
                if (forSlashCommandRegistration) {
                    // only need one keyword per file for registration purposes
                    this.commands.set(instance.config.keywords[0], instance);
                    // this.groups.add(instance.config.parent);
                } else {
                    instance.config.keywords.forEach(keyword => {
                        this.commands.set(keyword, instance);
                        // this.groups.add(instance.config.parent);
                    });
                }
            }
        });
    }

    static isCommand(obj: any): boolean {
        return obj.default.prototype instanceof Command && obj.default !== VoiceCommand;
    }
}

export interface CommandRegistryResult {
    keyword: string
    command: Command
}
