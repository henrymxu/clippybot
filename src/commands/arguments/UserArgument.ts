import {ChatInputCommandInteraction, User} from 'discord.js';
import {BaseArgumentConfigBuilder, CommandArgumentConfig} from './ArgumentConfig';
import {SharedSlashCommandOptions} from '@discordjs/builders';

export class UserArgument extends CommandArgumentConfig<User> {
    constructor(
        key: string,
        description: string,
        required: boolean,
        voiceCommandPrioritized: boolean,
    ) {
        super(key, description, required, voiceCommandPrioritized);
    }

    addToBuilderAsOption(builder: SharedSlashCommandOptions) {
        builder.addUserOption(option => {
            option.setName(this.key)
                .setDescription(this.description)
                .setRequired(this.required);
            return option;
        });
    }

    parseFromInteraction(source: ChatInputCommandInteraction): User | undefined {
        return source.options.getUser(this.key, this.required) ?? undefined;
    }
}

export class UserArgumentBuilder extends BaseArgumentConfigBuilder<User> {
    build(): UserArgument {
        return new UserArgument(
            this.key,
            this.description,
            this.required,
            this.voiceCommandPrioritized,
        );
    }
}
