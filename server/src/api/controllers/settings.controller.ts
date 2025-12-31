import { Request, Response } from "express";
import {SettingsService, ISettingsService} from "server/src/services/settings/index";
import EmailSettings from "server/src/domain/emailSettings";
const settingsService: ISettingsService = new SettingsService();

export const settingsController = {
    getEmailSettings: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const emailSettings: EmailSettings = await settingsService.getEmailSettings(userId);
        return res.json(emailSettings);
    },
    updateEmailSettings: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const emailSettings: EmailSettings = req.body;
        await settingsService.updateEmailSettings(userId, emailSettings);
        return res.json({ message: "Email settings updated" });
    },
}