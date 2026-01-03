import { Request, Response } from "express";
import { AuthService, IAuthService } from "server/src/services/auth/";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";

const authService = new AuthService(new UsersDrizzleRepository());

export const authController = {
    getUser: async (req: Request, res: Response) => {
        // stub
        res.json(null)
    }
};