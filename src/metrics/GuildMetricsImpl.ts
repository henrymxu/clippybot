import {GuildMetrics} from './GuildMetrics';
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

    async fetchSoundboardUsage(): Promise<{}> {
        if (!this.db) {
            return Promise.reject();
        }

        const pipeline = [
            {
                $match: {
                    audienceSize: { $gte: 2 } // Filters events with audience size >= 2
                }
            },
            {
                $group: {
                    _id: "$soundboardId",
                    usage: { $sum: 1 }
                }
            },
            {
                $sort: {
                    usage: -1 // Sorts by usage in descending order
                }
            },
        ];

        const result = await this.db.collection('soundboard_usage').aggregate(pipeline).toArray();
        return {soundboard_usage: result.map(doc => { return {id: doc._id, usage: doc.usage} })};
    }
}
