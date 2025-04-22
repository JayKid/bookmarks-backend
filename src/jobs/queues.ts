import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

export const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Define our job queues
export const thumbnailQueue = new Queue('thumbnail-processing', {
    connection: redisOptions,
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: 100 // keep the last 100 failed jobs
    }
}); 