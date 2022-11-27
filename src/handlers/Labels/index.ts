import { Request, Response } from "express";
import { LabelError } from "../../errors";
import LabelsService from "../../services/Labels";

export default class LabelsHandler {
    private labelsService: LabelsService;

    public constructor(labelsService: LabelsService) {
        this.labelsService = labelsService;
    }

    public getLabels = async (req: Request, res: Response) => {
        // Validate input if needed
        // Get labels through the service
        // @ts-ignore because user is guaranteed by the middleware
        const labels = await this.labelsService.getLabels(req.user.id);
        // Deal with errors if any
        if (labels instanceof LabelError) {
            return res.status(500).json({
                error: { type: "label-fetch-error", message: labels.errorMessage }
            });
        }
        // Return in the appropriate format
        return res.status(200).json({ labels });
    };

    public createLabel = async (req: Request, res: Response) => {
        // Validate input
        if (!req.body?.name) {
            return res.status(400).json({
                error: {
                    type: "missing-name",
                    message: "missing name"
                }
            });
        }
        const { name } = req.body;
        // Save bookmark
        // @ts-ignore because user is guaranteed by the middleware
        const label = await this.labelsService.createLabel({ name, userId: req.user.id });
        // Deal with errors if needed
        if (label instanceof LabelError) {
            return res.status(500).json({
                error: {
                    type: "label-error",
                    message: label.errorMessage,
                }
            });
        }
        // Return in the appropriate format
        return res.status(200).json({ label });
    };
}
