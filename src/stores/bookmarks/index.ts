import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";

export default class BookmarksStore {
    private db: Knex;
    private readonly TABLE_NAME = "bookmarks";

    public constructor(db: Knex) {
        this.db = db;
    }

    private getTable(): Knex.QueryBuilder<Bookmark, Bookmark[]> {
        return this.db<Bookmark, Bookmark[]>(this.TABLE_NAME);
    }

    public getBookmarks = async (): Promise<Bookmark> => {
        const [bookmarks] = await this.getTable();
        return bookmarks;
    };
};
