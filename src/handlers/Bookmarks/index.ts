import { BlobOptions } from "buffer";
import { Request, Response } from "express";
import BookmarksService from "../../services/Bookmarks";

export default class BookmarksHandler {
    private bookmarksService: BookmarksService;

    public constructor(bookmarksService: BookmarksService) {
        this.bookmarksService = bookmarksService;
    }

    public getBookmarks = async (req: Request, res: Response) => {
        // Validate input if needed
        // Get bookmarks through the service
        const bookmarks = await this.bookmarksService.getBookmarks();
        // Deal with errors if any
        // Return in the appropriate format
        return res.status(200).json({ bookmarks });
    };

    public addBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.body?.bookmark?.url) {
            return res.status(400).json({ message: "missing URL" });
        }
        if (!this.isValidUrl(req.body.bookmark.url)) {
            return res.status(400).json({ message: "invalid URL provided" });
        }
        const { url, title } = req.body.bookmark;
        // Save bookmark
        const bookmark = await this.bookmarksService.addBookmark(url, title);
        // Deal with errors if any
        // Return in the appropriate format
        return res.status(200).send({ bookmark });
    };

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
        }
        catch (err) {
            return false;
        }
        return true;
    }
};
