import axios from 'axios';
import * as cheerio from 'cheerio';

export default class TitleService {
    /**
     * Extracts title from a webpage
     * Looks for <title> tag, og:title, and falls back to first h1 if only one exists
     */
    public async getTitleFromPage(url: string): Promise<string | null> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BookmarksApp/1.0; +https://bookmarks-app.example.com)'
                },
                timeout: 5000
            });

            const html = response.data;
            const $ = cheerio.load(html);
            
            // Try the page title first
            const pageTitle = $('title').text().trim();
            if (pageTitle) return pageTitle;
            
            // Then try Open Graph title
            const ogTitle = $('meta[property="og:title"]').attr('content');
            if (ogTitle) return ogTitle;
            
            // Then try Twitter title
            const twitterTitle = $('meta[name="twitter:title"]').attr('content');
            if (twitterTitle) return twitterTitle;
            
            // Finally, if there's only one h1 tag, use that
            const h1Elements = $('h1');
            if (h1Elements.length === 1) {
                const h1Title = h1Elements.first().text().trim();
                if (h1Title) return h1Title;
            }
            
            return null;
        } catch (error) {
            console.error(`Failed to fetch title for ${url}:`, error);
            return null;
        }
    }
} 