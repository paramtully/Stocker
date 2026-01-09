import { Request, Response } from "express";
import { AuthService, IAuthService } from "server/src/services/auth/";
import getUserId from "../shared/getUser";

const authService: IAuthService = new AuthService();

export const authController = {
    getUser: async (req: Request, res: Response) => {
        try {
            const userId = getUserId(req);
            const user = await authService.getUserById(userId!);
            return res.json(user);
        } catch (error) {
            console.error("Error getting user:", error);
            return res.status(500).json({ error: "Failed to get user" });
        }
    }
};