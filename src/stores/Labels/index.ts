import { Knex } from "knex";
import { randomUUID } from "crypto";
import { Label } from "../../interfaces/Label";
import { LabelError } from "../../errors";

export default class LabelsStore {
    private database: Knex;
    private readonly TABLE_NAME = "labels";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<Label, Label[]> {
        return this.database<Label, Label[]>(this.TABLE_NAME);
    }

    public getLabels = async (userId: string): Promise<Label[] | LabelError> => {
        try {
            return await this.getTable().where('user_id', userId).orderBy("created_at", "desc");
        }
        catch (err) {
            return new LabelError("There was an error retrieving the labels");
        }
    };

    public createLabel = async ({ name, userId }: { name: string, userId: string }): Promise<Label | LabelError> => {
        try {
            const label = await this.getTable().insert({
                id: randomUUID(),
                name,
                user_id: userId
            }).returning('id');
            return {
                id: label[0].id,
                name,
                user_id: userId
            };
        } catch (err) {
            //@ts-ignore
            return new LabelError("There was an error creating the label");
        }
    };
}
