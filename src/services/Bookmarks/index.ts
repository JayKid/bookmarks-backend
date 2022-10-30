import BookmarksStore from "../../stores/Bookmarks";

export default class BookmarksService {
    private bookmarksStore;

    public constructor(bookmarksStore: BookmarksStore) {
        this.bookmarksStore = bookmarksStore;
    }

    public getBookmarks = async () => {
        return await this.bookmarksStore.getBookmarks();
    };

    public addBookmark = async (url: string, title: string) => {
        const bookmark = this.bookmarksStore.addBookmark({ url, title });
        return bookmark;
    }
};
