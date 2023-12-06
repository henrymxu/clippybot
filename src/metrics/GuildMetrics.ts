export interface GuildMetrics {
    addSoundboardUsage(userId: String, soundboardId: String, audience: number);
    fetchSoundboardUsage(count: number): Promise<SoundboardUsage>;
}

export type SoundboardUsage = {
    stats: {
        id: string,
        usage: number,
        topUsers: {
            id: string,
            count: number
        }[]
    }[]
}
