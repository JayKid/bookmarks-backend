import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";
import { BookmarkAlreadyExistsError, BookmarkError } from "../../errors";
import { randomUUID } from "crypto";

type BookmarkWithOptionalLabelRow = {
    id: string;
    url: string;
    title?: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    label_name: string;
    label_id: string;
}

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
            const result = await this.database.raw(`SELECT b.id, b.url, b.title, b.user_id, b.created_at, b.updated_at, l.id as label_id, l.name as label_name
            FROM bookmarks b
            LEFT JOIN labels_bookmarks lb
            ON lb.bookmark_id = b.id
            LEFT JOIN labels l
            ON l.id = lb.label_id
            WHERE b.user_id = ?`, userId);

            // { [bookmarkId]: { bookmark_id, bookmark_url, bookmark_title, labels: [{ id: name }]} }
            const bookmarksWithLabels = {} as any;
            if (result.rows) {
                result.rows.forEach((bookmarkWithLabelRow: BookmarkWithOptionalLabelRow) => {

                    if (!bookmarksWithLabels[bookmarkWithLabelRow.id]) {
                        const hasLabel = !!bookmarkWithLabelRow.label_id;

                        bookmarksWithLabels[bookmarkWithLabelRow.id] = {
                            id: bookmarkWithLabelRow.id,
                            url: bookmarkWithLabelRow.url,
                            title: bookmarkWithLabelRow.title,
                            created_at: bookmarkWithLabelRow.created_at,
                            updated_at: bookmarkWithLabelRow.updated_at,
                        }
                        if (hasLabel) {
                            bookmarksWithLabels[bookmarkWithLabelRow.id].labels = [{ id: bookmarkWithLabelRow.label_id, name: bookmarkWithLabelRow.label_name }]
                        }
                    }
                    else {
                        const newLabel = { id: bookmarkWithLabelRow.label_id, name: bookmarkWithLabelRow.label_name };
                        if (!bookmarksWithLabels[bookmarkWithLabelRow.id].labels.includes(newLabel)) {
                            bookmarksWithLabels[bookmarkWithLabelRow.id].labels.push(newLabel);
                        }
                    }

                });
                return Object.values(bookmarksWithLabels);
            }

            return new BookmarkError("Foo");

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
