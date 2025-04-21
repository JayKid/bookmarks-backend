import { Request, Response } from "express";
import { ListDoesNotExistError, ListError } from "../../errors";
import ListsService from "../../services/Lists";

export default class ListsHandler {
    private listsService: ListsService;

    public constructor(listsService: ListsService) {
        this.listsService = listsService;
    }

    public getLists = async (req: Request, res: Response) => {
        // @ts-ignore because user is guaranteed by the middleware
        const lists = await this.listsService.getLists(req.user.id);
        if (lists instanceof ListError) {
            return res.status(500).json({
                error: { type: "list-fetch-error", message: lists.errorMessage }
            });
        }
        return res.status(200).json({ lists });
    };

    public createList = async (req: Request, res: Response) => {
        if (!req.body?.name) {
            return res.status(400).json({
                error: {
                    type: "missing-name",
                    message: "missing name"
                }
            });
        }
        const { name, description } = req.body;
        // @ts-ignore because user is guaranteed by the middleware
        const list = await this.listsService.createList({ name, description, userId: req.user.id });
        if (list instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-creation-error",
                    message: list.errorMessage,
                }
            });
        }
        return res.status(200).json({ list });
    };

    public updateList = async (req: Request, res: Response) => {
        if (!req.params?.listId) {
            return res.status(400).json({
                error: {
                    type: "missing-list-id",
                    message: "missing list ID"
                }
            });
        }

        if (req.body?.name !== undefined && req.body.name.length === 0) {
            return res.status(400).json({
                error: {
                    type: "invalid-name",
                    message: "A list cannot have an empty name"
                }
            });
        }

        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;
        const { listId } = req.params;
        const { name, description } = req.body;

        const isListOwner = await this.listsService.isOwner({ listId, userId });
        if (isListOwner instanceof ListDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isListOwner.type,
                    message: isListOwner.errorMessage
                }
            });
        }
        if (!isListOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-list",
                    message: "User does not own this list"
                }
            });
        }

        const fieldsToUpdate = {
            name,
            description,
        };

        const list = await this.listsService.updateList(listId, fieldsToUpdate);
        if (list instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-error",
                    message: list.errorMessage,
                }
            });
        }

        return res.status(200).json({ list });
    };

    public deleteList = async (req: Request, res: Response) => {
        if (!req.params?.listId) {
            return res.status(400).json({
                error: {
                    type: "missing-list-id",
                    message: "missing list ID"
                }
            });
        }
        const { listId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const result = await this.listsService.deleteList({ listId, userId: req.user.id });
        if (result instanceof ListDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: result.type,
                    message: result.errorMessage,
                }
            });
        }
        if (result instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-error",
                    message: result.errorMessage,
                }
            });
        }
        return res.status(200).json({ success: true });
    }

    public addBookmarkToList = async (req: Request, res: Response) => {
        if (!req.params?.listId || !req.body?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-parameters",
                    message: "missing list ID or bookmark ID"
                }
            });
        }

        const { listId } = req.params;
        const { bookmarkId } = req.body;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        const isListOwner = await this.listsService.isOwner({ listId, userId });
        
        if (isListOwner instanceof ListDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isListOwner.type,
                    message: isListOwner.errorMessage
                }
            });
        }
        if (!isListOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-list",
                    message: "User does not own this list"
                }
            });
        }

        const result = await this.listsService.addBookmarkToList({ listId, bookmarkId });
        if (result instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-error",
                    message: result.errorMessage,
                }
            });
        }

        return res.status(200).json({ success: true });
    }

    public removeBookmarkFromList = async (req: Request, res: Response) => {
        if (!req.params?.listId || !req.params?.bookmarkId) {
            return res.status(400).json({
                error: {
                    type: "missing-parameters",
                    message: "missing list ID or bookmark ID"
                }
            });
        }

        const { listId, bookmarkId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        const isListOwner = await this.listsService.isOwner({ listId, userId });
        if (isListOwner instanceof ListDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isListOwner.type,
                    message: isListOwner.errorMessage
                }
            });
        }
        if (!isListOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-list",
                    message: "User does not own this list"
                }
            });
        }

        const result = await this.listsService.removeBookmarkFromList({ listId, bookmarkId });
        if (result instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-error",
                    message: result.errorMessage,
                }
            });
        }

        return res.status(200).json({ success: true });
    }

    public getBookmarksInList = async (req: Request, res: Response) => {
        if (!req.params?.listId) {
            return res.status(400).json({
                error: {
                    type: "missing-list-id",
                    message: "missing list ID"
                }
            });
        }

        const { listId } = req.params;
        // @ts-ignore because user is guaranteed by the middleware
        const userId = req.user.id;

        const isListOwner = await this.listsService.isOwner({ listId, userId });
        if (isListOwner instanceof ListDoesNotExistError) {
            return res.status(404).json({
                error: {
                    type: isListOwner.type,
                    message: isListOwner.errorMessage
                }
            });
        }
        if (!isListOwner) {
            return res.status(403).json({
                error: {
                    type: "forbidden-access-to-list",
                    message: "User does not own this list"
                }
            });
        }

        const bookmarks = await this.listsService.getBookmarksInList(listId);
        if (bookmarks instanceof ListError) {
            return res.status(500).json({
                error: {
                    type: "list-error",
                    message: bookmarks.errorMessage,
                }
            });
        }

        return res.status(200).json({ bookmarks });
    }
} 