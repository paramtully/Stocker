import { Response, NextFunction, Request } from "express";
import IAuthService from "server/src/services/auth/IAuth.service";
import AuthService from "server/src/services/auth/auth.service";

const authService: IAuthService = new AuthService();

// Middleware to create guest users
export const guestHandler = [
    async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req?.headers?.authorization;

        try {
            if (!authHeader?.startsWith("Bearer ")) {
                const tokens = await authService.createGuestUser();
                return res.json({ tokens });
            }
        } catch (err) {
            console.warn("Failed to create guest user:", err);
            return res.status(500).json({ error: "Failed to create guest user" });
        }
        return next();
    },
]
                