import {ChatInputCommandInteraction, User} from 'discord.js';
import {SharedSlashCommandOptions} from '@discordjs/builders';

export abstract class CommandArgumentConfig<T> {
    key: string;
    description: string;
    voiceCommandPrioritized: boolean;
    required: boolean;
    default?: T;

    protected constructor(key: string,
                          description: string,
                          required: boolean,
                          voiceCommandPrioritized: boolean,
                          defaultValue?: T) {
        this.key = key;
        this.description = description;
        this.required = required;
        this.default = defaultValue;
        this.voiceCommandPrioritized = voiceCommandPrioritized;
    }

    abstract addToBuilderAsOption(builder: SharedSlashCommandOptions)

    abstract parseFromInteraction(source: ChatInputCommandInteraction): T | undefined
}

export abstract class BaseArgumentConfigBuilder<T> {
    protected key: string;
    protected description: string;
    protected required = true;
    protected voiceCommandPrioritized = false;
    protected default?: T;

    constructor(
        key: string,
        description: string
    ) {
        this.key = key;
        this.description = description;
    }

    isNotRequired(defaultValue?: T): this {
        this.required = false;
        this.default = defaultValue;
        return this;
    }

    isVoiceCommandPrioritized(): this {
        this.voiceCommandPrioritized = true;
        return this;
    }

    abstract build(): CommandArgumentConfig<T>
}

export type CommandArgumentType = string | number | User
