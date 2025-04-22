import axios from 'axios';
import * as cheerio from 'cheerio';

export default class ThumbnailService {
    /**
     * Extracts thumbnail URL from meta tags in a webpage
     * Looks for og:image, twitter:image, and image_src meta tags
     */
    public async getThumbnailUrlFromPage(url: string): Promise<string | null> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BookmarksApp/1.0; +https://bookmarks-app.example.com)'
                },
                timeout: 5000
            });

            const html = response.data;
            const $ = cheerio.load(html);
            
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) return ogImage;
            
            const twitterImage = $('meta[name="twitter:image"]').attr('content');
            if (twitterImage) return twitterImage;
            
            const linkImage = $('link[rel="image_src"]').attr('href');
            if (linkImage) return linkImage;
            
            const articleImage = $('meta[property="article:image"]').attr('content');
            if (articleImage) return articleImage;
            
            return null;
        } catch (error) {
            console.error(`Failed to fetch thumbnail for ${url}:`, error);
            return null;
        }
    }
} 