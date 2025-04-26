import { Request, Response } from "express";
import { ImportExportError, InvalidImportFormatError } from "../../errors";
import BookmarksService from "../../services/Bookmarks";
import LabelsService from "../../services/Labels";
import ListsService from "../../services/Lists";

export default class ImportExportHandler {
    private bookmarksService: BookmarksService;
    private labelsService: LabelsService;
    private listsService: ListsService;

    public constructor(
        bookmarksService: BookmarksService, 
        labelsService: LabelsService, 
        listsService: ListsService
    ) {
        this.bookmarksService = bookmarksService;
        this.labelsService = labelsService;
        this.listsService = listsService;
    }

    public exportUserData = async (req: Request, res: Response) => {
        try {
            // @ts-ignore because user is guaranteed by the middleware
            const userId = req.user.id;
            
            // Fetch all user data
            const bookmarks = await this.bookmarksService.getBookmarks(userId);
            const labels = await this.labelsService.getLabels(userId);
            const lists = await this.listsService.getLists(userId);
            
            // Check for errors
            if (bookmarks instanceof Error) {
                return res.status(500).json({
                    error: { type: "export-error", message: "Error fetching bookmarks" }
                });
            }
            
            if (labels instanceof Error) {
                return res.status(500).json({
                    error: { type: "export-error", message: "Error fetching labels" }
                });
            }
            
            if (lists instanceof Error) {
                return res.status(500).json({
                    error: { type: "export-error", message: "Error fetching lists" }
                });
            }

            // For each list, fetch its bookmarks
            const listsWithBookmarks = await Promise.all(
                lists.map(async (list) => {
                    const listBookmarks = await this.listsService.getBookmarksInList(list.id);
                    if (listBookmarks instanceof Error) {
                        return {
                            ...list,
                            bookmarks: []
                        };
                    }
                    return {
                        ...list,
                        bookmarks: listBookmarks.map(bookmark => ({
                            id: bookmark.id
                        }))
                    };
                })
            );
            
            // Create a map of bookmarks with their labels
            const bookmarkLabelMap = new Map();
            bookmarks.forEach(bookmark => {
                if (bookmark.labels && bookmark.labels.length > 0) {
                    bookmark.labels.forEach(label => {
                        if (!bookmarkLabelMap.has(label.id)) {
                            bookmarkLabelMap.set(label.id, []);
                        }
                        bookmarkLabelMap.get(label.id).push({ id: bookmark.id });
                    });
                }
            });
            
            // Add bookmarks to each label
            const labelsWithBookmarks = labels.map(label => {
                return {
                    ...label,
                    bookmarks: bookmarkLabelMap.get(label.id) || []
                };
            });
            
            // Clean up user-specific data from the export and remove labels array from bookmarks
            const cleanedBookmarks = bookmarks.map(bookmark => {
                const { user_id, labels, ...cleanedBookmark } = bookmark;
                return cleanedBookmark;
            });
            
            const cleanedLabels = labelsWithBookmarks.map(label => {
                const { user_id, ...cleanedLabel } = label;
                return cleanedLabel;
            });
            
            const cleanedLists = listsWithBookmarks.map(list => {
                const { user_id, ...cleanedList } = list;
                return cleanedList;
            });
            
            // Create export data structure
            const exportData = {
                bookmarks: cleanedBookmarks,
                labels: cleanedLabels,
                lists: cleanedLists,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=bookmarks-export.json');
            
            return res.status(200).json(exportData);
        } catch (error) {
            return res.status(500).json({
                error: { 
                    type: "export-error", 
                    message: "An error occurred during export" 
                }
            });
        }
    };

    public importUserData = async (req: Request, res: Response) => {
        try {
            // @ts-ignore because user is guaranteed by the middleware
            const userId = req.user.id;
            
            // Validate import file format
            if (!req.body || !req.body.version) {
                return res.status(400).json({
                    error: {
                        type: "invalid-import-format",
                        message: "Invalid import format: missing version"
                    }
                });
            }
            
            const { bookmarks, labels, lists } = req.body;
            
            // Process each component in order: labels first, then bookmarks, then lists
            const importResults = {
                labels: { created: 0, errors: 0 },
                bookmarks: { created: 0, errors: 0 },
                lists: { created: 0, errors: 0 },
                bookmarkLabels: { created: 0, errors: 0 },
                listBookmarks: { created: 0, errors: 0 }
            };
            
            // Create a map of original IDs to new IDs for references
            const labelIdMap = new Map();
            const bookmarkIdMap = new Map();
            const listIdMap = new Map();
            
            // 1. Import Labels
            if (labels && Array.isArray(labels)) {
                for (const label of labels) {
                    try {
                        const newLabel = await this.labelsService.createLabel({ 
                            name: label.name, 
                            userId 
                        });
                        
                        if (!(newLabel instanceof Error)) {
                            labelIdMap.set(label.id, newLabel.id);
                            importResults.labels.created++;
                        } else {
                            importResults.labels.errors++;
                        }
                    } catch (error) {
                        importResults.labels.errors++;
                    }
                }
            }
            
            // 2. Import Bookmarks
            if (bookmarks && Array.isArray(bookmarks)) {
                for (const bookmark of bookmarks) {
                    try {
                        const newBookmark = await this.bookmarksService.addBookmark({ 
                            url: bookmark.url, 
                            title: bookmark.title, 
                            thumbnail: bookmark.thumbnail, 
                            userId 
                        });
                        
                        if (!(newBookmark instanceof Error)) {
                            bookmarkIdMap.set(bookmark.id, newBookmark.id);
                            importResults.bookmarks.created++;
                        } else {
                            importResults.bookmarks.errors++;
                        }
                    } catch (error) {
                        importResults.bookmarks.errors++;
                    }
                }
            }

            // 3. Add bookmarks to labels
            if (labels && Array.isArray(labels)) {
                for (const label of labels) {
                    if (label.bookmarks && Array.isArray(label.bookmarks)) {
                        const newLabelId = labelIdMap.get(label.id);
                        if (newLabelId) {
                            for (const bookmark of label.bookmarks) {
                                const newBookmarkId = bookmarkIdMap.get(bookmark.id);
                                if (newBookmarkId) {
                                    const result = await this.bookmarksService.addLabelToBookmark({
                                        bookmarkId: newBookmarkId,
                                        labelId: newLabelId,
                                        userId
                                    });
                                    
                                    if (!(result instanceof Error)) {
                                        importResults.bookmarkLabels.created++;
                                    } else {
                                        importResults.bookmarkLabels.errors++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // 4. Import Lists
            if (lists && Array.isArray(lists)) {
                for (const list of lists) {
                    try {
                        const newList = await this.listsService.createList({ 
                            name: list.name, 
                            description: list.description, 
                            userId 
                        });
                        
                        if (!(newList instanceof Error)) {
                            listIdMap.set(list.id, newList.id);
                            importResults.lists.created++;
                            
                            // Add bookmarks to list
                            if (list.bookmarks && Array.isArray(list.bookmarks)) {
                                for (const bookmark of list.bookmarks) {
                                    // Find the new ID of the bookmark from our mapping
                                    const newBookmarkId = bookmarkIdMap.get(bookmark.id);
                                    if (newBookmarkId) {
                                        const result = await this.listsService.addBookmarkToList({
                                            listId: newList.id,
                                            bookmarkId: newBookmarkId
                                        });
                                        
                                        if (!(result instanceof Error)) {
                                            importResults.listBookmarks.created++;
                                        } else {
                                            importResults.listBookmarks.errors++;
                                        }
                                    }
                                }
                            }
                        } else {
                            importResults.lists.errors++;
                        }
                    } catch (error) {
                        importResults.lists.errors++;
                    }
                }
            }
            
            return res.status(200).json({ 
                success: true, 
                results: importResults 
            });
        } catch (error) {
            return res.status(500).json({
                error: { 
                    type: "import-error", 
                    message: "An error occurred during import" 
                }
            });
        }
    };
} 