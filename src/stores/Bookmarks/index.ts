import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";
import { v4 as uuidv4 } from "uuid";

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

    public addBookmark = async ({ url, title }: { url: string, title?: string }): Promise<Bookmark | Error> => {
        try {
            const bookmark = await this.getTable().insert({
                id: uuidv4(),
                url,
                title,
            }).returning('id');
            return {
                id: bookmark[0].id,
                url,
                title,
            };
        } catch (err) {
            //@ts-ignore
            if (err?.constraint === 'bookmarks_url_unique') {
                return new Error("This URL already exists");
            }
            return new Error("There was an error saving the bookmark");
        }
    };
}
