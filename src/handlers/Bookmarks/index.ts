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
        // @ts-ignore because user is guaranteed by the middleware
        const bookmarks = await this.bookmarksService.getBookmarks(req.user.id);
        // Deal with errors if any
        if (bookmarks instanceof BookmarkError) {
            return res.status(500).json({
                error: { type: "bookmark-fetch-error", message: bookmarks.errorMessage }
            });
        }
        // Return in the appropriate format
        return res.status(200).json({ bookmarks });
    };

    public addBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.body?.url) {
            return res.status(400).json({
                error: {
                    type: "missing-url",
                    message: "missing URL"
                }
            });
        }
        if (!this.isValidUrl(req.body.url)) {
            return res.status(400).json({
                error: {
                    type: "invalid-url",
                    message: "invalid URL provided",
                }
            });
        }
        const { url, title } = req.body;
        // Save bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const bookmark = await this.bookmarksService.addBookmark({ url, title, userId: req.user.id });
        // Deal with errors if needed
        if (bookmark instanceof BookmarkAlreadyExistsError) {
            return res.status(400).json({
                error: {
                    type: "bookmark-already-exists",
                    message: bookmark.errorMessage,
                }
            });
        }
        if (bookmark instanceof BookmarkError) {
            return res.status(500).json({
                error: {
                    type: "bookmark-creation-error",
                    message: bookmark.errorMessage,
                }
            });
        }
        // Return in the appropriate format
        return res.status(200).json({ bookmark });
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
