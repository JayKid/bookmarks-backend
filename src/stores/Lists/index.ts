import { Knex } from "knex";
import { randomUUID } from "crypto";
import { List } from "../../interfaces/List";
import { ListsBookmarks } from "../../interfaces/List/listsbookmarks";
import { ListDoesNotExistError, ListError } from "../../errors";

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

    public getBookmarksInList = async (listId: string): Promise<string[] | ListError> => {
        try {
            const bookmarks = await this.getJoinTable()
                .where('list_id', listId)
                .select('bookmark_id');
            return bookmarks.map(b => b.bookmark_id);
        } catch (err) {
            return new ListError("There was an error retrieving bookmarks from the list");
        }
    }
} 