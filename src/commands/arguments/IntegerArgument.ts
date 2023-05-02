import {BaseArgumentConfigBuilder, CommandArgumentConfig} from './ArgumentConfig';
import {SharedSlashCommandOptions} from '@discordjs/builders';
import {ChatInputCommandInteraction} from 'discord.js';

export class IntegerArgument extends CommandArgumentConfig<number> {
    minValue?: number;
    maxValue?: number;
    choices?: {name: string, value: number}[];

    constructor(
        key: string,
        description: string,
        required: boolean,
        voiceCommandPrioritized: boolean,
        defaultValue?: number,
        minValue?: number,
        maxValue?: number,
        choices?: {name: string, value: number}[]
    ) {
        super(key, description, required, voiceCommandPrioritized, defaultValue);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.choices = choices;
    }

    addToBuilderAsOption(builder: SharedSlashCommandOptions) {
        builder.addIntegerOption(option => {
            option.setName(this.key)
                .setDescription(this.description)
                .setRequired(this.required);
            if (this.minValue) {
                option.setMinValue(this.minValue);
            }
            if (this.maxValue) {
                option.setMaxValue(this.maxValue);
            }
            if (this.choices) {
                option.addChoices(...this.choices);
            }
            return option;
        });
    }

    parseFromInteraction(source: ChatInputCommandInteraction): number | undefined {
        return source.options.getNumber(this.key, this.required) || this.default;
    }
}

export class IntegerArgumentBuilder extends BaseArgumentConfigBuilder<number> {
    minValue?: number;
    maxValue?: number;
    choices?: {name: string, value: number}[];

    setMinValue(length: number): IntegerArgumentBuilder {
        this.minValue = length;
        return this;
    }

    setMaxValue(length: number): IntegerArgumentBuilder {
        this.maxValue = length;
        return this;
    }

    setChoices(choices: {name: string, value: number}[]): IntegerArgumentBuilder {
        this.choices = choices;
        return this;
    }

    build(): IntegerArgument {
        return new IntegerArgument(
            this.key,
            this.description,
            this.required,
            this.voiceCommandPrioritized,
            this.default,
            this.minValue,
            this.maxValue,
            this.choices
        );
    }
}
