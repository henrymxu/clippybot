import {ChatInputCommandInteraction, MessageComponentInteraction} from 'discord.js';

export interface CommandDispatcher {
    handleSlashCommand(interaction: ChatInputCommandInteraction);
    handleButtonInteraction(interaction: MessageComponentInteraction);
}
