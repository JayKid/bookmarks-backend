import { Worker, Job } from 'bullmq';
import { redisOptions } from './queues';
import TitleService from '../services/Titles';
import BookmarksService from '../services/Bookmarks';
import BookmarksStore from '../stores/Bookmarks';
import { Knex } from 'knex';

interface TitleJobData {
    bookmarkId: string;
    url: string;
}

export default class TitleWorker {
    private worker: Worker;
    private titleService: TitleService;
    private bookmarksService: BookmarksService;

    constructor(database: Knex) {
        this.titleService = new TitleService();
        this.bookmarksService = new BookmarksService(new BookmarksStore(database));

        this.worker = new Worker('title-processing', 
            async (job: Job<TitleJobData>) => await this.processTitleJob(job),
            { connection: redisOptions }
        );

        // Set up event handlers
        this.worker.on('completed', (job) => {
            console.log(`Title job ${job.id} completed successfully`);
        });

        this.worker.on('failed', (job, error) => {
            console.error(`Title job ${job?.id} failed:`, error);
        });
    }

    private async processTitleJob(job: Job<TitleJobData>): Promise<void> {
        const { bookmarkId, url } = job.data;
        
        try {
            await job.updateProgress(10);
            
            const title = await this.titleService.getTitleFromPage(url);
            await job.updateProgress(50);
            
            if (title) {
                const result = await this.bookmarksService.updateBookmark(bookmarkId, { 
                    title: title
                });
                await job.updateProgress(100);
                
            } else {
                await job.updateProgress(100);
            }
        } catch (error) {
            console.error(`Error processing title for ${url}:`, error);
            throw error;
        }
    }
} 