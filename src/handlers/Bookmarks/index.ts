import { Request, Response } from "express";
import BookmarksService from "../../services/Bookmarks";

export default class BookmarksHandler {
    private bookmarksService: BookmarksService;

    public constructor(bookmarksService: BookmarksService) {
        this.bookmarksService = bookmarksService;
    }

    public getBookmarks = async (req: Request, res: Response) => {
        // Validate query params if needed
        // Get bookmarks through the service
        const bookmarks = await this.bookmarksService.getBookmarks();
        // Deal with errors if any
        // Return in the appropriate format
        return res.json({ bookmarks });
    };
};
