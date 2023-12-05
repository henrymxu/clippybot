import {GuildMetrics, SoundboardUsage} from './GuildMetrics';
import {Db} from 'mongodb';

export class GuildMetricsImpl implements GuildMetrics {
    private readonly db: Db | undefined;
    constructor(db: Db | undefined) {
        this.db = db;
    }

    private uploadMetric(key, metricData) {
        if (this.db) {
            this.db.collection(key).insertOne(metricData).catch(err => {
                console.log(`Error uploading metric to ${key}: ${err}`)
            });
        }
    }

    addSoundboardUsage(userId: String, soundboardId: String, audience: number) {
        const eventData = {
            userId: userId,
            soundboardId: soundboardId,
            audienceSize: audience,
            timestamp: new Date().getTime(),
        }
        this.uploadMetric('soundboard_usage', eventData)
    }

    async fetchSoundboardUsage(count: number): Promise<SoundboardUsage> {
        if (!this.db) {
            return Promise.reject();
        }

        const pipeline = [
            {
                $match: {
                    audienceSize: { $gte: 2 } // Filters events with audience size >= 2
                }
            },
            { $unwind: "$userId" },
            {
                $group: {
                    _id: { soundboardId: "$soundboardId", userId: "$userId" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.soundboardId",
                    users: { $push: { userId: "$_id.userId", count: "$count" } },
                    totalCount: { $sum: "$count" } // Calculate totalUsage
                }
            },
            { $sort: { totalCount: -1 } },
            { $limit: count },
            {
                $project: {
                    _id: 1,
                    topUsers: { $slice: ["$users", 3] },
                    totalCount: 1
                }
            },
        ];
        /*
            { _id: int, totalCount: int, topUsers: [{userId: int, count: int}]
         */
        const result = await this.db.collection('soundboard_usage').aggregate(pipeline).toArray();
        return {stats: result.map(doc => {
            const users = doc.topUsers.map(user => { return { id: user.userId, count: user.count }})
                .sort((a, b) => b.count - a.count);
            return {
                id: doc._id, usage: doc.totalCount, topUsers: users
            }
        })};
    }
}
