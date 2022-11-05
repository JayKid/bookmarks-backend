import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";
import { BookmarkAlreadyExistsError, BookmarkError } from "../../errors";
import { randomUUID } from "crypto";

export default class BookmarksStore {
    private database: Knex;
    private readonly TABLE_NAME = "bookmarks";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<Bookmark, Bookmark[]> {
        return this.database<Bookmark, Bookmark[]>(this.TABLE_NAME);
    }

    public getBookmarks = async (userId: string): Promise<Bookmark[] | BookmarkError> => {
        try {
            return await this.getTable().where('user_id', userId).orderBy("created_at", "desc");
        }
        catch (err) {
            return new BookmarkError("There was an error retrieving the bookmarks");
        }
    };

    public addBookmark = async ({ url, title, userId }: { url: string, title?: string, userId: string }): Promise<Bookmark | BookmarkAlreadyExistsError | BookmarkError> => {
        try {
            const bookmark = await this.getTable().insert({
                id: randomUUID(),
                url,
                title,
                user_id: userId
            }).returning('id');
            return {
                id: bookmark[0].id,
                url,
                title,
                user_id: userId
            };
        } catch (err) {
            //@ts-ignore
            if (err?.constraint === 'bookmarks_url_unique') {
                return new BookmarkAlreadyExistsError("This URL already exists");
            }
            return new BookmarkError("There was an error saving the bookmark");
        }
    };
}
