import { Worker, Job } from 'bullmq';
import { redisOptions } from './queues';
import ThumbnailService from '../services/Thumbnails';
import BookmarksService from '../services/Bookmarks';
import BookmarksStore from '../stores/Bookmarks';
import { Knex } from 'knex';

interface ThumbnailJobData {
    bookmarkId: string;
    url: string;
}

export default class ThumbnailWorker {
    private worker: Worker;
    private thumbnailService: ThumbnailService;
    private bookmarksService: BookmarksService;

    constructor(database: Knex) {
        this.thumbnailService = new ThumbnailService();
        this.bookmarksService = new BookmarksService(new BookmarksStore(database));

        this.worker = new Worker('thumbnail-processing', 
            async (job: Job<ThumbnailJobData>) => await this.processThumbnailJob(job),
            { connection: redisOptions }
        );

        // Set up event handlers
        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed successfully`);
        });

        this.worker.on('failed', (job, error) => {
            console.error(`Job ${job?.id} failed:`, error);
        });
    }

    private async processThumbnailJob(job: Job<ThumbnailJobData>): Promise<void> {
        const { bookmarkId, url } = job.data;
        
        try {
            await job.updateProgress(10);
            
            const thumbnailUrl = await this.thumbnailService.getThumbnailUrlFromPage(url);
            await job.updateProgress(50);
            
            if (thumbnailUrl) {
                const result = await this.bookmarksService.updateBookmark(bookmarkId, { 
                    thumbnail: thumbnailUrl
                });
                await job.updateProgress(100);
                
            } else {
                await job.updateProgress(100);
            }
        } catch (error) {
            console.error(`Error processing thumbnail for ${url}:`, error);
            throw error;
        }
    }
} 