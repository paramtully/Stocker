import { JWTClaims, RequestWithClaims } from "../shared/types";
import { Response, NextFunction, Request } from "express";

export const adminVerify = [
    async (req: Request, res: Response, next: NextFunction) => {
      
        const claims = (req as RequestWithClaims).APIGatewayProxyEvent?.requestContext?.authorizer?.claims as JWTClaims;
        if (!claims) {
            console.warn("Invalid token: no claims");
            return res.status(403).json({ error: "Invalid token" });
        }
        if (claims.custom.userType !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        return next();
    },
]