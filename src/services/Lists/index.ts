import { List } from "../../interfaces/List";
import ListsStore from "../../stores/Lists";
import { ListDoesNotExistError, ListError } from "../../errors";
import { Bookmark } from "../../interfaces/Bookmark";

export default class ListsService {
    private listsStore;

    public constructor(listsStore: ListsStore) {
        this.listsStore = listsStore;
    }

    public getLists = async (userId: string) => {
        return await this.listsStore.getLists(userId);
    };

    public createList = async ({ name, description, userId }: { name: string, description?: string, userId: string }) => {
        return await this.listsStore.createList({ name, description, userId });
    }

    public updateList = async (listId: string, fieldsToUpdate: Pick<List, 'name' | 'description'>) => {
        return await this.listsStore.updateList(listId, fieldsToUpdate);
    }

    public deleteList = async ({ listId, userId }: { listId: string, userId: string }) => {
        return await this.listsStore.deleteList(listId, userId);
    }

    public isOwner = async ({ listId, userId }: { listId: string, userId: string }) => {
        return await this.listsStore.isOwner({ listId, userId });
    }

    public addBookmarkToList = async ({ listId, bookmarkId }: { listId: string, bookmarkId: string }) => {
        return await this.listsStore.addBookmarkToList({ listId, bookmarkId });
    }

    public removeBookmarkFromList = async ({ listId, bookmarkId }: { listId: string, bookmarkId: string }) => {
        return await this.listsStore.removeBookmarkFromList({ listId, bookmarkId });
    }

    public getBookmarksInList = async (listId: string) => {
        return await this.listsStore.getBookmarksInList(listId);
    }
} 