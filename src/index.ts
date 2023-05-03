#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {StartClippyBot} from './clippybot';
import {DeployCommands} from './deploycommands';
import {BotConfig} from './config/BotConfig';

function parseArgv(argv: any): BotConfig {
    console.log(JSON.stringify(argv));
    return new BotConfig(argv);
}

yargs(hideBin(process.argv))
    .command('start', 'Start clippybot!', (yargs) => {
        return yargs
            .options({
                'discord_token': {
                    description: 'Discord API token',
                    type: 'string',
                },
            });
    }, (argv) => {
        StartClippyBot(parseArgv(argv));
    })
    .command('deploy', 'Deploy the clippybot commands!', (yargs) => {
        return yargs
            .options({
                'discord_token': {
                    description: 'Discord API token',
                    type: 'string',
                },
                'application_id': {
                    description: 'Discord Application ID',
                    type: 'string',
                },
            });
    }, (argv) => {
        DeployCommands(parseArgv(argv));
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging'
    })
    .help()
    .alias('help', 'h')
    .demandCommand(1)
    .parseSync();

