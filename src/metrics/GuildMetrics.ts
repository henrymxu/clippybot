export interface GuildMetrics {
    addSoundboardUsage(userId: String, soundboardId: String, audience: number);
    // TODO: change to not string
    fetchSoundboardUsage(): Promise<{}>;
}
