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
        const label = this.labelsStore.createLabel({ name, userId });
        return label;
    }

    public deleteLabel = async ({ labelId, userId }: { labelId: string, userId: string }) => {
        const label = this.labelsStore.deleteLabel(labelId, userId);
        return label;
    }
}
