import { AuthCognitoClient, AuthExternalService } from "server/src/infra/external/auth/aws";
import { Response, NextFunction, Request } from "express";

const externalAuthService: AuthExternalService = new AuthCognitoClient();

export const adminOnly = [
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await externalAuthService.getUserFromRequest(req, true);
        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        return next();
    },
]
