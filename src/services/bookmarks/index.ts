import BookmarksStore from "../../stores/bookmarks";

export default class BookmarksService {
    private bookmarksStore;

    public constructor(bookmarksStore: BookmarksStore) {
        this.bookmarksStore = bookmarksStore;
    }

    public getBookmarks = async () => {
        return await this.bookmarksStore.getBookmarks();
    };
};
