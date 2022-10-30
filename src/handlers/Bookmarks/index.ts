import { Request, Response } from "express";
import { BookmarkAlreadyExistsError, BookmarkError } from "../../errors";
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
        if (bookmarks instanceof BookmarkError) {
            return res.status(500).json({ message: bookmarks.errorMessage });
        }
        // Return in the appropriate format
        return res.status(200).json({ bookmarks });
    };

    public addBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.body?.url) {
            return res.status(400).json({ message: "missing URL" });
        }
        if (!this.isValidUrl(req.body.url)) {
            return res.status(400).json({ message: "invalid URL provided" });
        }
        const { url, title } = req.body;
        // Save bookmark
        const bookmark = await this.bookmarksService.addBookmark(url, title);
        // Deal with errors if needed
        if (bookmark instanceof BookmarkAlreadyExistsError) {
            return res.status(400).json({ message: bookmark.errorMessage });
        }
        if (bookmark instanceof BookmarkError) {
            return res.status(500).json({ message: bookmark.errorMessage });
        }
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
