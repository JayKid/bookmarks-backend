import { Request, Response } from "express";
import ImportExportHandler from "..";
import BookmarksService from "../../../services/Bookmarks";
import LabelsService from "../../../services/Labels";
import ListsService from "../../../services/Lists";
import { Bookmark } from "../../../interfaces/Bookmark";
import { Label } from "../../../interfaces/Label";
import { List } from "../../../interfaces/List";
import { BookmarkError, LabelError } from "../../../errors";

describe("ImportExportHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockBookmarksService: jest.Mocked<BookmarksService>;
    let mockLabelsService: jest.Mocked<LabelsService>;
    let mockListsService: jest.Mocked<ListsService>;
    let importExportHandler: ImportExportHandler;
    
    beforeEach(() => {
        mockRequest = {
            user: { id: "test-user-id", email: "test@example.com" },
            body: {},
            params: {}
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn()
        };
        
        mockBookmarksService = {
            getBookmarks: jest.fn(),
            addBookmark: jest.fn(),
            updateBookmark: jest.fn(),
            deleteBookmark: jest.fn(),
            addLabelToBookmark: jest.fn(),
            removeLabelFromBookmark: jest.fn(),
            isOwner: jest.fn()
        } as unknown as jest.Mocked<BookmarksService>;
        
        mockLabelsService = {
            getLabels: jest.fn(),
            createLabel: jest.fn(),
            updateLabel: jest.fn(),
            deleteLabel: jest.fn(),
            isOwner: jest.fn()
        } as unknown as jest.Mocked<LabelsService>;
        
        mockListsService = {
            getLists: jest.fn(),
            createList: jest.fn(),
            updateList: jest.fn(),
            deleteList: jest.fn(),
            addBookmarkToList: jest.fn(),
            removeBookmarkFromList: jest.fn(),
            getBookmarksInList: jest.fn(),
            getList: jest.fn(),
            isOwner: jest.fn()
        } as unknown as jest.Mocked<ListsService>;
        
        importExportHandler = new ImportExportHandler(
            mockBookmarksService,
            mockLabelsService,
            mockListsService
        );
    });
    
    describe("exportUserData", () => {
        it("should export user data successfully", async () => {
            const mockBookmarks = [
                { 
                    id: "bookmark1", 
                    url: "https://example.com", 
                    title: "Example", 
                    user_id: "test-user-id",
                    labels: [{ id: "label1", name: "Work" }]
                }
            ] as unknown as Bookmark[];
            
            const mockLabels = [
                { id: "label1", name: "Work", user_id: "test-user-id" }
            ] as unknown as Label[];
            
            const mockLists = [
                { id: "list1", name: "Reading List", user_id: "test-user-id" }
            ] as unknown as List[];
            
            // Mock the list bookmarks return value
            const mockListBookmarks = [
                { id: "bookmark1", url: "https://example.com", title: "Example", user_id: "test-user-id" }
            ] as unknown as Bookmark[];
            
            mockBookmarksService.getBookmarks.mockResolvedValue(mockBookmarks);
            mockLabelsService.getLabels.mockResolvedValue(mockLabels);
            mockListsService.getLists.mockResolvedValue(mockLists);
            mockListsService.getBookmarksInList.mockResolvedValue(mockListBookmarks);
            
            await importExportHandler.exportUserData(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=bookmarks-export.json');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            
            // Check that user_id is removed from exported data
            const exportedData = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(exportedData.bookmarks[0]).not.toHaveProperty('user_id');
            expect(exportedData.bookmarks[0]).not.toHaveProperty('labels'); // Bookmarks should no longer have labels
            expect(exportedData.labels[0]).not.toHaveProperty('user_id');
            expect(exportedData.lists[0]).not.toHaveProperty('user_id');
            
            // Verify lists contain bookmark references
            expect(exportedData.lists[0].bookmarks).toBeDefined();
            expect(exportedData.lists[0].bookmarks[0]).toEqual({ id: "bookmark1" });
            
            // Verify labels contain bookmark references
            expect(exportedData.labels[0].bookmarks).toBeDefined();
            expect(exportedData.labels[0].bookmarks[0]).toEqual({ id: "bookmark1" });
            
            // Verify the rest of the data is correct
            expect(exportedData).toMatchObject({
                bookmarks: [{ id: "bookmark1", url: "https://example.com", title: "Example" }],
                labels: [{ 
                    id: "label1", 
                    name: "Work", 
                    bookmarks: [{ id: "bookmark1" }]
                }],
                lists: [{ 
                    id: "list1", 
                    name: "Reading List",
                    bookmarks: [{ id: "bookmark1" }]
                }],
                exportDate: expect.any(String),
                version: "1.0"
            });
        });
        
        it("should handle errors in fetching bookmarks", async () => {
            mockBookmarksService.getBookmarks.mockResolvedValue(new BookmarkError("Failed to fetch bookmarks"));
            
            await importExportHandler.exportUserData(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: { type: "export-error", message: "Error fetching bookmarks" }
            });
        });
    });
    
    describe("importUserData", () => {
        it("should import user data successfully", async () => {
            mockRequest.body = {
                version: "1.0",
                labels: [{ 
                    id: "label1", 
                    name: "Work",
                    bookmarks: [{ id: "bookmark1" }]
                }],
                bookmarks: [{ 
                    id: "bookmark1", 
                    url: "https://example.com", 
                    title: "Example"
                }],
                lists: [{
                    id: "list1",
                    name: "Reading List",
                    bookmarks: [{ id: "bookmark1" }]
                }]
            };
            
            const mockLabel = { id: "new-label1", name: "Work", user_id: "test-user-id" } as Label;
            const mockBookmark = { 
                id: "new-bookmark1", 
                url: "https://example.com", 
                title: "Example", 
                user_id: "test-user-id" 
            } as Bookmark;
            const mockList = { 
                id: "new-list1", 
                name: "Reading List", 
                user_id: "test-user-id" 
            } as List;
            
            mockLabelsService.createLabel.mockResolvedValue(mockLabel);
            mockBookmarksService.addBookmark.mockResolvedValue(mockBookmark);
            mockBookmarksService.addLabelToBookmark.mockResolvedValue(mockBookmark);
            mockListsService.createList.mockResolvedValue(mockList);
            mockListsService.addBookmarkToList.mockResolvedValue(true);
            
            await importExportHandler.importUserData(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                results: expect.objectContaining({
                    labels: { created: 1, errors: 0 },
                    bookmarks: { created: 1, errors: 0 },
                    lists: { created: 1, errors: 0 }
                })
            });
        });
        
        it("should validate import format", async () => {
            mockRequest.body = {}; // Missing version
            
            await importExportHandler.importUserData(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    type: "invalid-import-format",
                    message: "Invalid import format: missing version"
                }
            });
        });
        
        it("should handle errors during import", async () => {
            mockRequest.body = {
                version: "1.0",
                labels: [{ id: "label1", name: "Work" }]
            };
            
            mockLabelsService.createLabel.mockResolvedValue(new LabelError("Failed to create label"));
            
            await importExportHandler.importUserData(mockRequest as Request, mockResponse as Response);
            
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                results: expect.objectContaining({
                    labels: { created: 0, errors: 1 }
                })
            });
        });
    });
}); 