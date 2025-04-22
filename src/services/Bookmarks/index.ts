import { Bookmark } from "../../interfaces/Bookmark";
import BookmarksStore from "../../stores/Bookmarks";

export default class BookmarksService {
    private bookmarksStore;

    public constructor(bookmarksStore: BookmarksStore) {
        this.bookmarksStore = bookmarksStore;
    }

    public getBookmarks = async (userId: string, labelId?: string) => {
        return await this.bookmarksStore.getBookmarks(userId, labelId);
    };

    public addBookmark = async ({ url, title, thumbnail, userId }: { url: string, title?: string, thumbnail?: string, userId: string }) => {
        return await this.bookmarksStore.addBookmark({ url, title, thumbnail, userId });
    }

    public updateBookmark = async (bookmarkId: string, fieldsToUpdate: Partial<Pick<Bookmark, 'url' | 'title' | 'thumbnail'>>) => {
        return await this.bookmarksStore.updateBookmark(bookmarkId, fieldsToUpdate);
    }

    public deleteBookmark = async (bookmarkId: string) => {
        return await this.bookmarksStore.deleteBookmark(bookmarkId);
    }

    public addLabelToBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }) => {
        return await this.bookmarksStore.addLabelToBookmark({ bookmarkId, labelId });
    }

    public removeLabelFromBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }) => {
        return await this.bookmarksStore.removeLabelFromBookmark({ bookmarkId, labelId });
    }

    public isOwner = async ({ bookmarkId, userId }: { bookmarkId: string, userId: string }) => {
        return await this.bookmarksStore.isOwner({ bookmarkId, userId });
    }
}
