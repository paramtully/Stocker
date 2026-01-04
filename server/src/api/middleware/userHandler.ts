import { NextFunction, Response, Request } from "express";
import { JWTClaims, RequestWithClaims, RequestWithCognitoUser } from "../shared/types";
import IAuthService from "server/src/services/auth/IAuth.service";
import AuthService from "server/src/services/auth/auth.service";
import User from "server/src/domain/user";



const authService: IAuthService = new AuthService();
export const userHandler = [
    // adds user to db if not already in db
    async (req: Request, res: Response, next: NextFunction) => {
        const claims = (req as RequestWithClaims).APIGatewayProxyEvent?.requestContext?.authorizer?.claims as JWTClaims;

        if (!claims) {
            console.warn("Invalid token: no claims");
            return res.status(403).json({ error: "Invalid token" });
        }

        const user = await authService.getUser(claims.sub);
        if (!user) {
            try {
                await authService.insertUser({
                    id: claims.sub,
                    email: claims.email,
                    name: {
                        first: claims.given_name,
                        last: claims.family_name,
                    },
                    role: claims.custom.userType as "admin" | "user" | "guest",
                    emailPreferences: { enabled: true, deliveryHour: 8 },
                } as User);
            } catch (err) {
                console.warn("Failed to add user to database:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
        }

        // adds user to request
        (req as RequestWithCognitoUser).cognitoUser = {
            sub: claims.sub,
            email: claims.email,
        };
        return next();
    },
]
