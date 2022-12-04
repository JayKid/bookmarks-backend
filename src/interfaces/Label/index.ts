export type Label = {
    id: string;
    name: string;
    user_id: string;
    created_at?: Date;
    updated_at?: Date;
};

export type EmbeddedLabel = {
    id: string;
    name: string;
}