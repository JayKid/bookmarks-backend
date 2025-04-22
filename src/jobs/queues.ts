import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

// For tests, we'll create a mock Queue implementation
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Define a mock Queue implementation for tests
class MockQueue {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    add() {
        // Do nothing in the mock
        return Promise.resolve({ id: 'mock-job-id' });
    }
    
    // Add any other methods you need to mock
}

// Define connection options for non-test environments
export const redisOptions: RedisOptions = isTestEnvironment 
    ? {} as RedisOptions
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    };

// Define our job queues - use mock in test environment
export const thumbnailQueue = isTestEnvironment 
    ? new MockQueue('thumbnail-processing') as unknown as Queue 
    : new Queue('thumbnail-processing', {
        connection: redisOptions,
        defaultJobOptions: {
            attempts: 3,
            removeOnComplete: true,
            removeOnFail: 100 // keep the last 100 failed jobs
        }
    }); 