import { Request, Response } from "express";
import ListsHandler from "../index";
import ListsService from "../../../services/Lists";
import { ListDoesNotExistError, ListError } from "../../../errors";
import { randomUUID } from "crypto";
import { Bookmark } from "../../../interfaces/Bookmark";

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

describe("ListsHandler", () => {
    let handler: ListsHandler;
    let mockService: jest.Mocked<ListsService>;
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockService = {
            getLists: jest.fn(),
            getList: jest.fn(),
            createList: jest.fn(),
            updateList: jest.fn(),
            deleteList: jest.fn(),
            isOwner: jest.fn(),
            addBookmarkToList: jest.fn(),
            removeBookmarkFromList: jest.fn(),
            getBookmarksInList: jest.fn(),
        } as any;

        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = {
            status: mockStatus,
            json: mockJson,
        };

        mockReq = {
            user: { id: randomUUID() },
        };

        handler = new ListsHandler(mockService);
    });

    describe("getLists", () => {
        it("should return lists for the user", async () => {
            const mockLists = [
                { id: randomUUID(), name: "List 1", user_id: mockReq.user!.id },
                { id: randomUUID(), name: "List 2", user_id: mockReq.user!.id },
            ];

            mockService.getLists.mockResolvedValue(mockLists);

            await handler.getLists(mockReq as Request, mockRes as Response);

            expect(mockService.getLists).toHaveBeenCalledWith(mockReq.user!.id);
            expect(mockJson).toHaveBeenCalledWith({ lists: mockLists });
        });

        it("should handle ListError", async () => {
            mockService.getLists.mockResolvedValue(new ListError("Error message"));

            await handler.getLists(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "list-fetch-error", message: "Error message" },
            });
        });
    });

    describe("createList", () => {
        it("should create a new list", async () => {
            const mockList = {
                id: randomUUID(),
                name: "New List",
                description: "Description",
                user_id: mockReq.user!.id,
            };

            mockReq.body = { name: "New List", description: "Description" };
            mockService.createList.mockResolvedValue(mockList);

            await handler.createList(mockReq as Request, mockRes as Response);

            expect(mockService.createList).toHaveBeenCalledWith({
                name: "New List",
                description: "Description",
                userId: mockReq.user!.id,
            });
            expect(mockJson).toHaveBeenCalledWith({ list: mockList });
        });

        it("should handle missing name", async () => {
            mockReq.body = {};

            await handler.createList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "missing-name", message: "missing name" },
            });
        });

        it("should handle ListError", async () => {
            mockReq.body = { name: "New List" };
            mockService.createList.mockResolvedValue(new ListError("Error message"));

            await handler.createList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "list-creation-error", message: "Error message" },
            });
        });
    });

    describe("updateList", () => {
        it("should update a list", async () => {
            const listId = randomUUID();
            const mockUpdatedList = {
                id: listId,
                name: "Updated List",
                description: "Updated Description",
                user_id: mockReq.user!.id,
            };

            mockReq.params = { listId };
            mockReq.body = { name: "Updated List", description: "Updated Description" };
            mockService.isOwner.mockResolvedValue(true);
            mockService.updateList.mockResolvedValue(mockUpdatedList);

            await handler.updateList(mockReq as Request, mockRes as Response);

            expect(mockService.isOwner).toHaveBeenCalledWith({
                listId,
                userId: mockReq.user!.id,
            });
            expect(mockService.updateList).toHaveBeenCalledWith(listId, {
                name: "Updated List",
                description: "Updated Description",
            });
            expect(mockJson).toHaveBeenCalledWith({ list: mockUpdatedList });
        });

        it("should handle missing listId", async () => {
            mockReq.params = {};

            await handler.updateList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "missing-list-id", message: "missing list ID" },
            });
        });

        it("should handle empty name", async () => {
            mockReq.params = { listId: randomUUID() };
            mockReq.body = { name: "" };

            await handler.updateList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: {
                    type: "invalid-name",
                    message: "A list cannot have an empty name",
                },
            });
        });

        it("should handle non-owner", async () => {
            const listId = randomUUID();
            mockReq.params = { listId };
            mockReq.body = { name: "Updated List" };
            mockService.isOwner.mockResolvedValue(false);

            await handler.updateList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({
                error: {
                    type: "forbidden-access-to-list",
                    message: "User does not own this list",
                },
            });
        });
    });

    describe("deleteList", () => {
        it("should delete a list", async () => {
            const listId = randomUUID();
            mockReq.params = { listId };

            await handler.deleteList(mockReq as Request, mockRes as Response);

            expect(mockService.deleteList).toHaveBeenCalledWith({
                listId,
                userId: mockReq.user!.id,
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        it("should handle ListDoesNotExistError", async () => {
            const listId = randomUUID();
            mockReq.params = { listId };
            mockService.deleteList.mockResolvedValue(
                new ListDoesNotExistError("List not found")
            );

            await handler.deleteList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "list-does-not-exist", message: "List not found" },
            });
        });
    });

    describe("addBookmarkToList", () => {
        it("should add a bookmark to a list", async () => {
            const listId = randomUUID();
            const bookmarkId = randomUUID();
            mockReq.params = { listId };
            mockReq.body = { bookmarkId };
            mockService.isOwner.mockResolvedValue(true);
            mockService.addBookmarkToList.mockResolvedValue(true);

            await handler.addBookmarkToList(mockReq as Request, mockRes as Response);

            expect(mockService.isOwner).toHaveBeenCalledWith({
                listId,
                userId: mockReq.user!.id,
            });
            expect(mockService.addBookmarkToList).toHaveBeenCalledWith({
                listId,
                bookmarkId,
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ success: true });
        });

        it("should handle missing parameters", async () => {
            mockReq.params = { listId: randomUUID() };
            mockReq.body = {};

            await handler.addBookmarkToList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: {
                    type: "missing-parameters",
                    message: "missing list ID or bookmark ID",
                },
            });
        });

        it("should handle missing listId", async () => {
            mockReq.params = {};
            mockReq.body = { bookmarkId: randomUUID() };

            await handler.addBookmarkToList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: {
                    type: "missing-parameters",
                    message: "missing list ID or bookmark ID",
                },
            });
        });
    });

    describe("removeBookmarkFromList", () => {
        it("should remove a bookmark from a list", async () => {
            const listId = randomUUID();
            const bookmarkId = randomUUID();
            mockReq.params = { listId, bookmarkId };
            mockService.isOwner.mockResolvedValue(true);
            mockService.removeBookmarkFromList.mockResolvedValue(true);

            await handler.removeBookmarkFromList(mockReq as Request, mockRes as Response);

            expect(mockService.isOwner).toHaveBeenCalledWith({
                listId,
                userId: mockReq.user!.id,
            });
            expect(mockService.removeBookmarkFromList).toHaveBeenCalledWith({
                listId,
                bookmarkId,
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
        });
    });

    describe("getBookmarksInList", () => {
        it("should get bookmarks in a list", async () => {
            const listId = randomUUID();
            const mockBookmarks: Bookmark[] = [
                {
                    id: randomUUID(),
                    url: "https://example.com/1",
                    title: "Example 1",
                    user_id: mockReq.user!.id,
                    labels: []
                },
                {
                    id: randomUUID(),
                    url: "https://example.com/2",
                    title: "Example 2",
                    user_id: mockReq.user!.id,
                    labels: []
                }
            ];
            mockReq.params = { listId };
            mockService.isOwner.mockResolvedValue(true);
            mockService.getBookmarksInList.mockResolvedValue(mockBookmarks);

            await handler.getBookmarksInList(mockReq as Request, mockRes as Response);

            expect(mockService.isOwner).toHaveBeenCalledWith({
                listId,
                userId: mockReq.user!.id,
            });
            expect(mockService.getBookmarksInList).toHaveBeenCalledWith(listId);
            expect(mockJson).toHaveBeenCalledWith({ bookmarks: mockBookmarks });
        });
    });

    describe("getList", () => {
        it("should get a list by id", async () => {
            const listId = randomUUID();
            const mockList = {
                id: listId,
                name: "Test List",
                description: "Test Description",
                user_id: mockReq.user!.id,
            };

            mockReq.params = { listId };
            mockService.getList.mockResolvedValue(mockList);

            await handler.getList(mockReq as Request, mockRes as Response);

            expect(mockService.getList).toHaveBeenCalledWith(listId, mockReq.user!.id);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ list: mockList });
        });

        it("should handle missing listId", async () => {
            mockReq.params = {};

            await handler.getList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "missing-list-id", message: "missing list ID" },
            });
        });

        it("should handle ListDoesNotExistError", async () => {
            const listId = randomUUID();
            mockReq.params = { listId };
            mockService.getList.mockResolvedValue(
                new ListDoesNotExistError("List not found")
            );

            await handler.getList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "list-does-not-exist", message: "List not found" },
            });
        });

        it("should handle ListError", async () => {
            const listId = randomUUID();
            mockReq.params = { listId };
            mockService.getList.mockResolvedValue(
                new ListError("Error retrieving list")
            );

            await handler.getList(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                error: { type: "list-error", message: "Error retrieving list" },
            });
        });
    });
}); 