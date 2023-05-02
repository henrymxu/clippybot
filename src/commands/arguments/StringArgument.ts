import {BaseArgumentConfigBuilder, CommandArgumentConfig} from './ArgumentConfig';
import {SharedSlashCommandOptions} from '@discordjs/builders';
import {ChatInputCommandInteraction} from 'discord.js';

export class StringArgument extends CommandArgumentConfig<string> {
    minLength?: number;
    maxLength?: number;
    choices?: {name: string, value: string}[];

    constructor(
        key: string,
        description: string,
        required: boolean,
        voiceCommandPrioritized: boolean,
        defaultValue?: string,
        minLength?: number,
        maxLength?: number,
        choices?: {name: string, value: string}[]
    ) {
        super(key, description, required, voiceCommandPrioritized, defaultValue);
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.choices = choices;
    }

    addToBuilderAsOption(builder: SharedSlashCommandOptions) {
        builder.addStringOption(option => {
            option.setName(this.key)
                .setDescription(this.description)
                .setRequired(this.required);
            if (this.maxLength) {
                option.setMaxLength(this.maxLength);
            }
            if (this.minLength) {
                option.setMinLength(this.minLength);
            }
            if (this.choices) {
                option.setChoices(...this.choices);
            }
            return option;
        });
    }

    parseFromInteraction(source: ChatInputCommandInteraction): string | undefined {
        return source.options.getString(this.key, this.required) || this.default;
    }
}

export class StringArgumentBuilder extends BaseArgumentConfigBuilder<string> {
    minLength?: number;
    maxLength?: number;
    choices?: {name: string, value: string}[];

    setMinLength(length: number): StringArgumentBuilder {
        this.minLength = length;
        return this;
    }

    setMaxLength(length: number): StringArgumentBuilder {
        this.maxLength = length;
        return this;
    }

    setChoices(choices: {name: string, value: string}[]): StringArgumentBuilder {
        this.choices = choices;
        return this;
    }

    build(): StringArgument {
        return new StringArgument(
            this.key,
            this.description,
            this.required,
            this.voiceCommandPrioritized,
            this.default,
            this.minLength,
            this.maxLength,
            this.choices
        );
    }
}
