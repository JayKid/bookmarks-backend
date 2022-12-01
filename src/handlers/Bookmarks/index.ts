import { Request, Response } from "express";
import { BookmarkAlreadyExistsError, BookmarkAlreadyHasLabel, BookmarkError, BookmarkDoesNotHaveLabelError } from "../../errors";
import BookmarksService from "../../services/Bookmarks";
import LabelsService from "../../services/Labels";

export default class BookmarksHandler {
    private bookmarksService: BookmarksService;
    private labelsService: LabelsService;

    public constructor(bookmarksService: BookmarksService, labelsService: LabelsService) {
        this.bookmarksService = bookmarksService;
        this.labelsService = labelsService;
    }

    public getBookmarks = async (req: Request, res: Response) => {
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;
        // Validate input if needed
        let labelId;
        if (req?.query?.labelId) {
            labelId = req?.query?.labelId as string;
            if (!this.labelsService.isOwner({ labelId, userId })) {
                return res.status(403).json({
                    error: {
                        type: "incorrect-label",
                        message: "User does not own this label or it does not exist"
                    }
                });
            }
        }

        // Get bookmarks through the service
        const bookmarks = await this.bookmarksService.getBookmarks(userId, labelId);
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

    public addLabelToBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.params?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-bookmark-id",
                    message: "missing bookmark ID"
                }
            });
        }
        if (!req.params?.labelId) {
            return res.status(400).json({
                error: {
                    type: "missing-label-id",
                    message: "missing label ID"
                }
            });
        }

        const { bookmarkId, labelId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        // Check ownership of both entities
        const isBookmarkOwner = await this.bookmarksService.isOwner({ bookmarkId, userId });
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "incorrect-bookmark",
                    message: "User does not own this bookmark or it does not exist"
                }
            });
        }
        const isLabelOwner = await this.labelsService.isOwner({ labelId, userId });
        if (!isLabelOwner) {
            return res.status(403).json({
                error: {
                    type: "incorrect-label",
                    message: "User does not own this label or it does not exist"
                }
            });
        }
        // Add label to bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const bookmark = await this.bookmarksService.addLabelToBookmark({ bookmarkId, labelId, userId });
        // Deal with errors if needed
        if (bookmark instanceof BookmarkAlreadyHasLabel) {
            return res.status(500).json({
                error: {
                    type: bookmark.type,
                    message: bookmark.errorMessage,
                }
            });
        }
        // Return in the appropriate format
        return res.status(200).send();
    }

    public removeLabelFromBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.params?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-bookmark-id",
                    message: "missing bookmark ID"
                }
            });
        }
        if (!req.params?.labelId) {
            return res.status(400).json({
                error: {
                    type: "missing-label-id",
                    message: "missing label ID"
                }
            });
        }

        const { bookmarkId, labelId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        // Check ownership of both entities
        const isBookmarkOwner = await this.bookmarksService.isOwner({ bookmarkId, userId });
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "incorrect-bookmark",
                    message: "User does not own this bookmark or it does not exist"
                }
            });
        }
        const isLabelOwner = await this.labelsService.isOwner({ labelId, userId });
        if (!isLabelOwner) {
            return res.status(403).json({
                error: {
                    type: "incorrect-label",
                    message: "User does not own this label or it does not exist"
                }
            });
        }

        // Remove label from bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const bookmark = await this.bookmarksService.removeLabelFromBookmark({ bookmarkId, labelId, userId });
        // Deal with errors if needed
        if (bookmark instanceof BookmarkDoesNotHaveLabelError) {
            return res.status(404).json({
                error: {
                    type: bookmark.type,
                    message: bookmark.errorMessage,
                }
            });
        }

        // Return in the appropriate format
        return res.status(200).send();
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
