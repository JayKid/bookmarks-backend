import { EmbeddedLabel } from "../Label";

export type Bookmark = {
    id: string;
    url: string;
    title?: string;
    thumbnail?: string;
    user_id: string;
    labels?: EmbeddedLabel[];
    created_at?: Date;
    updated_at?: Date;
};