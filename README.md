# Clippy Discord Bot

Clippy is a Discord Bot dedicated to making audio clips of users, perfect for soundboards!

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

## Features

- Create audio clips of users
- (Coming Soon) Create audio clips of channels

## Setup

1. `npm run deploy -- --discord_token <discord_token> --application_id <application_id>`

2. `npm run start -- --discord_token <discord_token> --mongo_uri <mongo_connection_uri>`

### API Tokens

| Name                                                                                     | Environment Variable | Description                                                 | Required |
|------------------------------------------------------------------------------------------|----------------------|-------------------------------------------------------------|----------|
| [Discord Bot Token](https://discord.com/developers/applications)                         | discord_token        | Required for the bot to login and communicate with discord. | ✓        |
| [Mongo Connection URI](https://www.mongodb.com/docs/manual/reference/connection-string/) | mongo_uri            | Required for storing configs and metrics                    | ✓        |


## Troubleshooting

## Support

- Feel free to create an issue on GitHub if there are any problems installing or using Clippy!

## License

This repository is licensed under Apache 2.0.  You may host an instance of this bot for non-commercial and personal use free of charge.
