import { Response } from "express";
import { AuthService, IAuthService } from "server/src/services/auth/";
import { RequestWithCognitoUser } from "../shared/types";
import getUserId from "../shared/getUser";

const authService: IAuthService = new AuthService();

export const authController = {
    getUser: async (req: RequestWithCognitoUser, res: Response) => {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const user = await authService.getUser(userId);
        return res.json(user);
    }
};