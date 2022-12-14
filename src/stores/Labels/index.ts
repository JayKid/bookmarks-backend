import { Knex } from "knex";
import { randomUUID } from "crypto";
import { Label } from "../../interfaces/Label";
import { LabelDoesNotExistError, LabelError } from "../../errors";

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

    public updateLabel = async (labelId: string, fieldsToUpdate: Pick<Label, 'name'>): Promise<Label | LabelError> => {
        try {
            const updatedLabelResult = await this.getTable().where({
                id: labelId,
            }).update({ ...fieldsToUpdate, updated_at: new Date() }).returning(['id', 'name', 'user_id']);
            if (!updatedLabelResult[0]) {
                return new LabelError("There was an error updating the label");
            }
            const updatedLabel = updatedLabelResult[0];
            return {
                id: labelId,
                name: updatedLabel.name,
                user_id: updatedLabel.user_id
            };
        } catch (err) {
            return new LabelError("There was an error updating the label");
        }
    }

    public deleteLabel = async (labelId: string, userId: string): Promise<true | LabelError> => {
        try {
            const deletionResult = await this.getTable().where('user_id', userId).andWhere('id', labelId).delete();
            if (deletionResult === 0) {
                return new LabelDoesNotExistError(`A label with id: ${labelId} does not exist`);
            }
            if (deletionResult === 1) {
                return true;
            }
            return new LabelError("There was an error creating the label");
        } catch (err) {
            //@ts-ignore
            return new LabelError("There was an error creating the label");
        }
    }

    public isOwner = async ({ labelId, userId }: { labelId: string, userId: string }): Promise<true | false | LabelDoesNotExistError | LabelError> => {
        try {
            const result = await this.getTable().where('id', labelId);
            if (result.length !== 1) {
                return new LabelDoesNotExistError(`The label with id: ${labelId} does not exist`);
            }

            if (result[0].user_id !== userId) {
                return false;
            }
            return true;

        } catch (err) {
            return new LabelError("An unexpected error occurred while retrieving the label");
        }
    }
}
