import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";

export default class BookmarksStore {
    private database: Knex;
    private readonly TABLE_NAME = "bookmarks";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<Bookmark, Bookmark[]> {
        return this.database<Bookmark, Bookmark[]>(this.TABLE_NAME);
    }

    public getBookmarks = async (): Promise<Bookmark[]> => {
        const bookmarks = await this.getTable().orderBy("created_at", "desc");
        return bookmarks;
    };
};
