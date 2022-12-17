import { Request, Response } from "express";
import { BookmarkAlreadyExistsError, BookmarkAlreadyHasLabelError, BookmarkError, BookmarkDoesNotHaveLabelError, BookmarkDoesNotExistError, LabelDoesNotExistError } from "../../errors";
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
            const isLabelOwner = this.labelsService.isOwner({ labelId, userId });
            if (isLabelOwner instanceof LabelDoesNotExistError) {
                return res.status(404).json({
                    error: {
                        type: isLabelOwner.type,
                        message: isLabelOwner.errorMessage
                    }
                });
            }
            if (!isLabelOwner) {
                return res.status(403).json({
                    error: {
                        type: "forbidden-access-to-label",
                        message: "User does not own this label"
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

        if (req.body.thumbnail !== undefined && !this.isValidUrl(req.body.thumbnail)) {
            return res.status(400).json({
                error: {
                    type: "invalid-thumbnail",
                    message: "invalid thumbnail provided",
                }
            });
        }
        const { url, title, thumbnail } = req.body;
        // Save bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const bookmark = await this.bookmarksService.addBookmark({ url, title, thumbnail, userId: req.user.id });
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

    public updateBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.params?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-bookmark-id",
                    message: "missing bookmark ID"
                }
            });
        }

        if (req.body?.url !== undefined && !this.isValidUrl(req.body.url)) {
            return res.status(400).json({
                error: {
                    type: "invalid-url",
                    message: "invalid URL provided",
                }
            });
        }

        if (req.body?.thumbnail !== undefined && req.body?.thumbnail !== ""  && !this.isValidUrl(req.body.thumbnail)) {
            return res.status(400).json({
                error: {
                    type: "invalid-thumbnail",
                    message: "invalid thumbnail provided",
                }
            });
        }

        const { bookmarkId } = req.params;
        const { url, title, thumbnail } = req.body;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        // Check ownership of bookmark
        const isBookmarkOwner = await this.bookmarksService.isOwner({ bookmarkId, userId });
        if (isBookmarkOwner instanceof BookmarkDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isBookmarkOwner.type,
                    message: isBookmarkOwner.errorMessage
                }
            });
        }
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-bookmark",
                    message: "User does not own this bookmark"
                }
            });
        }

        const fieldsToUpdate = {
            url,
            title,
            thumbnail,
        };

        // Update bookmark
        const updatedBookmark = await this.bookmarksService.updateBookmark(bookmarkId, fieldsToUpdate);
        // Deal with errors if needed
        if (updatedBookmark instanceof BookmarkError) {
            return res.status(500).json({
                error: {
                    type: updatedBookmark.type,
                    message: updatedBookmark.errorMessage,
                }
            });
        }
        // Return in the appropriate format
        return res.status(200).send({ bookmark: updatedBookmark });
    }

    public deleteBookmark = async (req: Request, res: Response) => {
        // Validate input
        if (!req.params?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-bookmark-id",
                    message: "missing bookmark ID"
                }
            });
        }

        const { bookmarkId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        // Check ownership of bookmark
        const isBookmarkOwner = await this.bookmarksService.isOwner({ bookmarkId, userId });
        if (isBookmarkOwner instanceof BookmarkDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isBookmarkOwner.type,
                    message: isBookmarkOwner.errorMessage
                }
            });
        }
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-bookmark",
                    message: "User does not own this bookmark"
                }
            });
        }

        // Delete bookmark
        const bookmark = await this.bookmarksService.deleteBookmark(bookmarkId);
        // Deal with errors if needed
        if (bookmark instanceof BookmarkError) {
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
        if (isBookmarkOwner instanceof BookmarkDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isBookmarkOwner.type,
                    message: isBookmarkOwner.errorMessage
                }
            });
        }
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-bookmark",
                    message: "User does not own this bookmark"
                }
            });
        }
        const isLabelOwner = await this.labelsService.isOwner({ labelId, userId });
        if (isLabelOwner instanceof LabelDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isLabelOwner.type,
                    message: isLabelOwner.errorMessage
                }
            });
        }
        if (!isLabelOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-label",
                    message: "User does not own this label"
                }
            });
        }
        // Add label to bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const bookmark = await this.bookmarksService.addLabelToBookmark({ bookmarkId, labelId, userId });
        // Deal with errors if needed
        if (bookmark instanceof BookmarkAlreadyHasLabelError) {
            return res.status(400).json({
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
        if (isBookmarkOwner instanceof BookmarkDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isBookmarkOwner.type,
                    message: isBookmarkOwner.errorMessage
                }
            });
        }
        if (!isBookmarkOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-bookmark",
                    message: "User does not own this bookmark"
                }
            });
        }
        const isLabelOwner = await this.labelsService.isOwner({ labelId, userId });
        if (isLabelOwner instanceof LabelDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isLabelOwner.type,
                    message: isLabelOwner.errorMessage
                }
            });
        }
        if (!isLabelOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-label",
                    message: "User does not own this label"
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
            if (!url) {
                return false;
            }
            new URL(url);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
