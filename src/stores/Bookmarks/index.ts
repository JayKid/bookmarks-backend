import { Knex } from "knex";
import { Bookmark } from "../../interfaces/Bookmark";
import { BookmarkAlreadyExistsError, BookmarkAlreadyHasLabelError, BookmarkDoesNotExistError, BookmarkDoesNotHaveLabelError, BookmarkError, BookmarkLabelError } from "../../errors";
import { randomUUID } from "crypto";
import { LabelsBookmarks } from "../../interfaces/Bookmark/labelsbookmarks";

type BookmarkWithOptionalLabelRow = {
    id: string;
    url: string;
    title?: string;
    thumbnail?: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    label_name: string;
    label_id: string;
}

export default class BookmarksStore {
    private database: Knex;
    private readonly TABLE_NAME = "bookmarks";
    private readonly LABELS_RELATIONAL_TABLE_NAME = "labels_bookmarks";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<Bookmark, Bookmark[]> {
        return this.database<Bookmark, Bookmark[]>(this.TABLE_NAME);
    }

    private getBookmarksLabelsTable(): Knex.QueryBuilder<LabelsBookmarks, LabelsBookmarks[]> {
        return this.database<LabelsBookmarks, LabelsBookmarks[]>(this.LABELS_RELATIONAL_TABLE_NAME);
    }

    public getBookmarks = async (userId: string, labelId?: string): Promise<Bookmark[] | BookmarkError> => {
        try {
            const result = await this.database.raw(`SELECT b.id, b.url, b.title, b.thumbnail, b.user_id, b.created_at, b.updated_at, l.id as label_id, l.name as label_name
            FROM bookmarks b
            LEFT JOIN labels_bookmarks lb
            ON lb.bookmark_id = b.id
            LEFT JOIN labels l
            ON l.id = lb.label_id
            WHERE b.user_id = ?`, userId);

            // { [bookmarkId]: { bookmark_id, bookmark_url, bookmark_title, bookmark_thumbnail, labels: [{ id: name }]} }
            const bookmarksWithLabels = {} as any;
            if (result.rows) {
                result.rows.forEach((bookmarkWithLabelRow: BookmarkWithOptionalLabelRow) => {

                    if (!bookmarksWithLabels[bookmarkWithLabelRow.id]) {
                        const hasLabel = !!bookmarkWithLabelRow.label_id;

                        bookmarksWithLabels[bookmarkWithLabelRow.id] = {
                            id: bookmarkWithLabelRow.id,
                            url: bookmarkWithLabelRow.url,
                            title: bookmarkWithLabelRow.title,
                            thumbnail: bookmarkWithLabelRow.thumbnail,
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
                const bookmarsWithLabels = Object.values(bookmarksWithLabels) as Bookmark[];

                if (labelId) {
                    const bookmarksFilteredByLabel = bookmarsWithLabels.filter((bookmark: Bookmark) => {
                        if (bookmark?.labels) {
                            let foundLabel = false;
                            bookmark.labels.forEach(label => {
                                if (label.id === labelId) {
                                    foundLabel = true;
                                }
                            });
                            return foundLabel;
                        }
                        return false;
                    }) as any;

                    return bookmarksFilteredByLabel;
                }
                return bookmarsWithLabels;
            }

            return new BookmarkError("There was an error retrieving the bookmarks");

        }
        catch (err) {
            return new BookmarkError("There was an error retrieving the bookmarks");
        }
    };

    public addBookmark = async ({ url, title, thumbnail, userId }: { url: string, title?: string, thumbnail?: string, userId: string }): Promise<Bookmark | BookmarkAlreadyExistsError | BookmarkError> => {
        try {
            const bookmark = await this.getTable().insert({
                id: randomUUID(),
                url,
                title,
                thumbnail,
                user_id: userId
            }).returning('id');
            return {
                id: bookmark[0].id,
                url,
                title,
                thumbnail,
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
    public updateBookmark = async (bookmarkId: string, fieldsToUpdate: Pick<Bookmark, 'url' | 'title' | 'thumbnail'>): Promise<Bookmark | BookmarkError> => {
        try {
            const updatedBookmarkResult = await this.getTable().where({
                id: bookmarkId,
            }).update({ ...fieldsToUpdate, updated_at: new Date() }).returning(['id', 'url', 'title', 'thumbnail', 'user_id']);
            if (!updatedBookmarkResult[0]) {
                return new BookmarkError("There was an error updating the bookmark");
            }
            const updatedBookmark = updatedBookmarkResult[0];
            return {
                id: bookmarkId,
                url: updatedBookmark.url,
                title: updatedBookmark.title,
                thumbnail: updatedBookmark?.thumbnail,
                user_id: updatedBookmark.user_id
            };
        } catch (err) {
            return new BookmarkError("There was an error updating the bookmark");
        }
    }

    public deleteBookmark = async (bookmarkId: string): Promise<true | BookmarkError> => {
        try {
            const deletionResult = await this.getTable().where('id', bookmarkId).delete();
            if (deletionResult === 0) {
                return new BookmarkDoesNotExistError(`The bookmark with ID: ${bookmarkId} does not exist`);
            }
            if (deletionResult === 1) {
                return true;
            }
            return new BookmarkError("There was an error deleting the bookmark");
        } catch (err) {
            return new BookmarkError("There was an error deleting the bookmark");
        }
    }

    public addLabelToBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }): Promise<true | BookmarkLabelError | BookmarkAlreadyHasLabelError> => {
        try {
            await this.getBookmarksLabelsTable().insert({
                id: randomUUID(),
                bookmark_id: bookmarkId,
                label_id: labelId,
            }).returning('id');

            return true;
        } catch (err) {
            //@ts-ignore for err containing constraint
            if (err?.constraint === 'labels_bookmarks_composite_index') {
                return new BookmarkAlreadyHasLabelError("This bookmark already has the label provided");
            }
            return new BookmarkLabelError("There was an error adding the label to the bookmark");
        }
    }

    public removeLabelFromBookmark = async ({ bookmarkId, labelId }: { bookmarkId: string, labelId: string }): Promise<true | BookmarkLabelError | BookmarkAlreadyExistsError> => {
        try {
            const deletionResult = await this.getBookmarksLabelsTable().where('bookmark_id', bookmarkId).andWhere('label_id', labelId).delete();
            if (deletionResult === 0) {
                return new BookmarkDoesNotHaveLabelError(`The bookmark with ID: ${bookmarkId} does not have a label with ID: ${labelId}`);
            }
            if (deletionResult === 1) {
                return true;
            }
            return new BookmarkLabelError("There was an error removing the label from the bookmark");
        } catch (err) {
            return new BookmarkLabelError("There was an error removing the label from the bookmark");
        }
    }

    public isOwner = async ({ bookmarkId, userId }: { bookmarkId: string, userId: string }): Promise<true | false | BookmarkDoesNotExistError | BookmarkError> => {
        try {
            const result = await this.getTable().where('id', bookmarkId);
            if (result.length !== 1) {
                return new BookmarkDoesNotExistError(`The bookmark with id: ${bookmarkId} does not exist`);
            }

            if (result[0].user_id !== userId) {
                return false;
            }
            return true;

        } catch (err) {
            return new BookmarkError("An unexpected error occurred while retrieving the bookmark");
        }
    }
}
