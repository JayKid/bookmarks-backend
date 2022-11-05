import BookmarksStore from "../../stores/Bookmarks";

export default class BookmarksService {
    private bookmarksStore;

    public constructor(bookmarksStore: BookmarksStore) {
        this.bookmarksStore = bookmarksStore;
    }

    public getBookmarks = async (userId: string) => {
        return await this.bookmarksStore.getBookmarks(userId);
    };

    public addBookmark = async ({ url, title, userId }: { url: string, title?: string, userId: string }) => {
        const bookmark = this.bookmarksStore.addBookmark({ url, title, userId });
        return bookmark;
    }
};
