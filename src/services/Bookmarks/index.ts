import BookmarksStore from "../../stores/Bookmarks";

export default class BookmarksService {
    private bookmarksStore;

    public constructor(bookmarksStore: BookmarksStore) {
        this.bookmarksStore = bookmarksStore;
    }

    public getBookmarks = async (userId: string, labelId?: string) => {
        return await this.bookmarksStore.getBookmarks(userId, labelId);
    };

    public addBookmark = async ({ url, title, userId }: { url: string, title?: string, userId: string }) => {
        const bookmark = this.bookmarksStore.addBookmark({ url, title, userId });
        return bookmark;
    }

    public addLabelToBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }) => {
        const bookmark = this.bookmarksStore.addLabelToBookmark({ bookmarkId, labelId });
        return bookmark;
    }

    public removeLabelFromBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }) => {
        const bookmark = this.bookmarksStore.removeLabelFromBookmark({ bookmarkId, labelId });
        return bookmark;
    }

    public isOwner = async ({ bookmarkId, userId }: { bookmarkId: string, userId: string }) => {
        return await this.bookmarksStore.isOwner({ bookmarkId, userId });
    }
}
