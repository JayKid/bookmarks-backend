import { Label } from "../../interfaces/Label";
import LabelsStore from "../../stores/Labels";

export default class LabelsService {
    private labelsStore;

    public constructor(labelsStore: LabelsStore) {
        this.labelsStore = labelsStore;
    }

    public getLabels = async (userId: string) => {
        return await this.labelsStore.getLabels(userId);
    };

    public createLabel = async ({ name, userId }: { name: string, userId: string }) => {
        return await this.labelsStore.createLabel({ name, userId });
    }

    public updateLabel = async (labelId: string, fieldsToUpdate: Pick<Label, 'name'>) => {
        return await this.labelsStore.updateLabel(labelId, fieldsToUpdate);
    }

    public deleteLabel = async ({ labelId, userId }: { labelId: string, userId: string }) => {
        return await this.labelsStore.deleteLabel(labelId, userId);
    }

    public isOwner = async ({ labelId, userId }: { labelId: string, userId: string }) => {
        return await this.labelsStore.isOwner({ labelId, userId });
    }
}
