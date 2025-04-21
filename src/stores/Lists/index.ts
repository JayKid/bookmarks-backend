import { Knex } from "knex";
import { randomUUID } from "crypto";
import { List } from "../../interfaces/List";
import { ListsBookmarks } from "../../interfaces/List/listsbookmarks";
import { ListDoesNotExistError, ListError } from "../../errors";
import { Bookmark } from "../../interfaces/Bookmark";

export default class ListsStore {
    private database: Knex;
    private readonly TABLE_NAME = "lists";
    private readonly JOIN_TABLE_NAME = "lists_bookmarks";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<List, List[]> {
        return this.database<List, List[]>(this.TABLE_NAME);
    }

    private getJoinTable(): Knex.QueryBuilder<ListsBookmarks, ListsBookmarks[]> {
        return this.database<ListsBookmarks, ListsBookmarks[]>(this.JOIN_TABLE_NAME);
    }

    public getLists = async (userId: string): Promise<List[] | ListError> => {
        try {
            return await this.getTable().where('user_id', userId).orderBy("created_at", "desc");
        }
        catch (err) {
            return new ListError("There was an error retrieving the lists");
        }
    };

    public createList = async ({ name, description, userId }: { name: string, description?: string, userId: string }): Promise<List | ListError> => {
        try {
            const list = await this.getTable().insert({
                id: randomUUID(),
                name,
                description,
                user_id: userId
            }).returning('*');
            return list[0];
        } catch (err) {
            return new ListError("There was an error creating the list");
        }
    };

    public updateList = async (listId: string, fieldsToUpdate: Pick<List, 'name' | 'description'>): Promise<List | ListError> => {
        try {
            const updatedListResult = await this.getTable().where({
                id: listId,
            }).update({ ...fieldsToUpdate, updated_at: new Date() }).returning('*');
            if (!updatedListResult[0]) {
                return new ListError("There was an error updating the list");
            }
            return updatedListResult[0];
        } catch (err) {
            return new ListError("There was an error updating the list");
        }
    }

    public deleteList = async (listId: string, userId: string): Promise<true | ListError> => {
        try {
            const deletionResult = await this.getTable().where('user_id', userId).andWhere('id', listId).delete();
            if (deletionResult === 0) {
                return new ListDoesNotExistError(`A list with id: ${listId} does not exist`);
            }
            if (deletionResult === 1) {
                return true;
            }
            return new ListError("There was an error deleting the list");
        } catch (err) {
            return new ListError("There was an error deleting the list");
        }
    }

    public isOwner = async ({ listId, userId }: { listId: string, userId: string }): Promise<true | false | ListDoesNotExistError | ListError> => {
        try {
            // Validate that listId is in the correct format (UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(listId)) {
                return new ListDoesNotExistError(`Invalid list ID format: ${listId}`);
            }
            
            const result = await this.getTable().where('id', listId);
            
            if (result.length !== 1) {
                return new ListDoesNotExistError(`The list with id: ${listId} does not exist`);
            }

            if (result[0].user_id !== userId) {
                return false;
            }
            
            return true;
        } catch (err) {
            return new ListError("An unexpected error occurred while retrieving the list");
        }
    }

    public addBookmarkToList = async ({ listId, bookmarkId }: { listId: string, bookmarkId: string }): Promise<true | ListError> => {
        try {
            await this.getJoinTable().insert({
                id: randomUUID(),
                list_id: listId,
                bookmark_id: bookmarkId
            });
            return true;
        } catch (err) {
            return new ListError("There was an error adding the bookmark to the list");
        }
    }

    public removeBookmarkFromList = async ({ listId, bookmarkId }: { listId: string, bookmarkId: string }): Promise<true | ListError> => {
        try {
            const deletionResult = await this.getJoinTable()
                .where('list_id', listId)
                .andWhere('bookmark_id', bookmarkId)
                .delete();
            
            if (deletionResult === 0) {
                return new ListError("The bookmark was not found in the list");
            }
            return true;
        } catch (err) {
            return new ListError("There was an error removing the bookmark from the list");
        }
    }

    public getBookmarksInList = async (listId: string): Promise<Bookmark[] | ListError> => {
        try {
            const bookmarkRows = await this.database
                .select(
                    'b.id', 
                    'b.url', 
                    'b.title', 
                    'b.thumbnail', 
                    'b.user_id', 
                    'b.created_at', 
                    'b.updated_at',
                    'l.id as label_id', 
                    'l.name as label_name'
                )
                .from(`${this.JOIN_TABLE_NAME} as lb`)
                .join('bookmarks as b', 'lb.bookmark_id', 'b.id')
                .leftJoin('labels_bookmarks as lbm', 'b.id', 'lbm.bookmark_id')
                .leftJoin('labels as l', 'lbm.label_id', 'l.id')
                .where('lb.list_id', listId);

            // Group results by bookmark ID to handle multiple labels per bookmark
            const bookmarksMap = new Map<string, Bookmark>();
            
            bookmarkRows.forEach(row => {
                if (!bookmarksMap.has(row.id)) {
                    // Create new bookmark entry
                    const bookmark: Bookmark = {
                        id: row.id,
                        url: row.url,
                        title: row.title,
                        thumbnail: row.thumbnail,
                        user_id: row.user_id,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        labels: []
                    };
                    bookmarksMap.set(row.id, bookmark);
                }
                
                // Add label if it exists
                if (row.label_id && row.label_name) {
                    const bookmark = bookmarksMap.get(row.id);
                    if (bookmark) {
                        if (!bookmark.labels) {
                            bookmark.labels = [];
                        }
                        const labelExists = bookmark.labels.some(label => label.id === row.label_id);
                        
                        if (!labelExists) {
                            bookmark.labels.push({
                                id: row.label_id,
                                name: row.label_name
                            });
                        }
                    }
                }
            });
            
            return Array.from(bookmarksMap.values());
        } catch (err) {
            return new ListError("There was an error retrieving bookmarks from the list");
        }
    }
} 