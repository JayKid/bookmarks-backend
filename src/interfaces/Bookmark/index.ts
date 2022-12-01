import { EmbeddedLabel } from "../Label";

export type Bookmark = {
    id: string;
    url: string;
    title?: string;
    user_id: string;
    labels?: EmbeddedLabel[];
};