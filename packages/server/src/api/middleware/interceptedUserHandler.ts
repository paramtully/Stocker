import { NextFunction, Response, Request } from "express";
import { AuthExternalService, AuthCognitoClient } from "server/src/infra/external/auth/aws";
import { RequestWithUser } from "../shared/RequestWithUser";
import { AuthService, IAuthService } from "server/src/services/auth/";


const authExternalService: AuthExternalService = new AuthCognitoClient();
const authService: IAuthService = new AuthService();

export const interceptedUserHandler = [
    // gets user from request and moves it to the request object
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await authExternalService.getUserFromRequest(req, true);
        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        (req as RequestWithUser).user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
        return next();
    },

    // add user to database if not already in database
    async (req: Request, res: Response, next: NextFunction) => {
        const reqUser = (req as RequestWithUser).user;
        const user = await authService.getUserById(reqUser.id);
        if (!user) {
            try {
                await authService.insertUser({
                    id: reqUser.id,
                    email: reqUser.email,
                    role: reqUser.role,
                    emailPreferences: { 
                        enabled: reqUser.role === "guest" ? false : true, 
                        deliveryHour: 8 
                    },
                });
            } catch (err) {
                console.warn("Failed to add user to database:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
        }
        return next();
    },
]