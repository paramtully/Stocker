import { Request, Response } from "express";
import {SettingsService, ISettingsService} from "server/src/services/settings/index";
import EmailSettings from "server/src/domain/emailSettings";
import getUserId from "../shared/getUser";
const settingsService: ISettingsService = new SettingsService();

export const settingsController = {
    getEmailSettings: async (req: Request, res: Response) => {
        try {
            const userId = getUserId(req);
            const emailSettings: EmailSettings = await settingsService.getEmailSettings(userId!);
            return res.json(emailSettings);
        } catch (error) {
            console.error("Error getting email settings:", error);
            return res.status(500).json({ error: "Failed to get email settings" });
        }
    },
    updateEmailSettings: async (req: Request, res: Response) => {
        try {
            const userId = getUserId(req);
            const emailSettings: EmailSettings = req.body;
            await settingsService.updateEmailSettings(userId!, emailSettings);
            return res.json({ message: "Email settings updated" });
        } catch (error) {
            console.error("Error updating email settings:", error);
            return res.status(500).json({ error: "Failed to update email settings" });
        }
    },
}