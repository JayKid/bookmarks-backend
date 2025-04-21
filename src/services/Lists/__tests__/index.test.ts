import ListsService from "../index";
import ListsStore from "../../../stores/Lists";
import { ListDoesNotExistError, ListError } from "../../../errors";
import { randomUUID } from "crypto";
import { Bookmark } from "../../../interfaces/Bookmark";

describe("ListsService", () => {
    let service: ListsService;
    let mockStore: jest.Mocked<ListsStore>;

    beforeEach(() => {
        mockStore = {
            getLists: jest.fn(),
            createList: jest.fn(),
            updateList: jest.fn(),
            deleteList: jest.fn(),
            isOwner: jest.fn(),
            addBookmarkToList: jest.fn(),
            removeBookmarkFromList: jest.fn(),
            getBookmarksInList: jest.fn(),
        } as any;

        service = new ListsService(mockStore);
    });

    describe("getLists", () => {
        it("should return lists from store", async () => {
            const userId = randomUUID();
            const mockLists = [
                { id: randomUUID(), name: "List 1", user_id: userId },
                { id: randomUUID(), name: "List 2", user_id: userId },
            ];

            mockStore.getLists.mockResolvedValue(mockLists);

            const result = await service.getLists(userId);
            expect(result).toEqual(mockLists);
            expect(mockStore.getLists).toHaveBeenCalledWith(userId);
        });
    });

    describe("createList", () => {
        it("should create a list through store", async () => {
            const userId = randomUUID();
            const mockList = {
                id: randomUUID(),
                name: "New List",
                description: "Description",
                user_id: userId,
            };

            mockStore.createList.mockResolvedValue(mockList);

            const result = await service.createList({
                name: "New List",
                description: "Description",
                userId,
            });

            expect(result).toEqual(mockList);
            expect(mockStore.createList).toHaveBeenCalledWith({
                name: "New List",
                description: "Description",
                userId,
            });
        });
    });

    describe("updateList", () => {
        it("should update a list through store", async () => {
            const listId = randomUUID();
            const mockUpdatedList = {
                id: listId,
                name: "Updated List",
                description: "Updated Description",
                user_id: randomUUID(),
            };

            mockStore.updateList.mockResolvedValue(mockUpdatedList);

            const result = await service.updateList(listId, {
                name: "Updated List",
                description: "Updated Description",
            });

            expect(result).toEqual(mockUpdatedList);
            expect(mockStore.updateList).toHaveBeenCalledWith(listId, {
                name: "Updated List",
                description: "Updated Description",
            });
        });
    });

    describe("deleteList", () => {
        it("should delete a list through store", async () => {
            const listId = randomUUID();
            const userId = randomUUID();

            mockStore.deleteList.mockResolvedValue(true);

            const result = await service.deleteList({ listId, userId });
            expect(result).toBe(true);
            expect(mockStore.deleteList).toHaveBeenCalledWith(listId, userId);
        });
    });

    describe("isOwner", () => {
        it("should check ownership through store", async () => {
            const listId = randomUUID();
            const userId = randomUUID();

            mockStore.isOwner.mockResolvedValue(true);

            const result = await service.isOwner({ listId, userId });
            expect(result).toBe(true);
            expect(mockStore.isOwner).toHaveBeenCalledWith({ listId, userId });
        });
    });

    describe("addBookmarkToList", () => {
        it("should add a bookmark to a list through store", async () => {
            const listId = randomUUID();
            const bookmarkId = randomUUID();

            mockStore.addBookmarkToList.mockResolvedValue(true);

            const result = await service.addBookmarkToList({ listId, bookmarkId });
            expect(result).toBe(true);
            expect(mockStore.addBookmarkToList).toHaveBeenCalledWith({ listId, bookmarkId });
        });
    });

    describe("removeBookmarkFromList", () => {
        it("should remove a bookmark from a list through store", async () => {
            const listId = randomUUID();
            const bookmarkId = randomUUID();

            mockStore.removeBookmarkFromList.mockResolvedValue(true);

            const result = await service.removeBookmarkFromList({ listId, bookmarkId });
            expect(result).toBe(true);
            expect(mockStore.removeBookmarkFromList).toHaveBeenCalledWith({ listId, bookmarkId });
        });
    });

    describe("getBookmarksInList", () => {
        it("should get bookmarks in a list through store", async () => {
            const listId = randomUUID();
            const userId = randomUUID();
            const mockBookmarks: Bookmark[] = [
                {
                    id: randomUUID(),
                    url: "https://example.com/1",
                    title: "Example 1",
                    user_id: userId,
                    labels: []
                },
                {
                    id: randomUUID(),
                    url: "https://example.com/2",
                    title: "Example 2",
                    user_id: userId,
                    labels: []
                }
            ];

            mockStore.getBookmarksInList.mockResolvedValue(mockBookmarks);

            const result = await service.getBookmarksInList(listId);
            expect(result).toEqual(mockBookmarks);
            expect(mockStore.getBookmarksInList).toHaveBeenCalledWith(listId);
        });
    });
}); 