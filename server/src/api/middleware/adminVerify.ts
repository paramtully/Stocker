import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import { RequestWithCognitoUser } from "../shared/types";
import { Response, NextFunction } from "express";
import User from "server/src/domain/user";
import { cognitoJwtVerifier } from "../shared/cognito";

export const adminVerify = [
    async (req: RequestWithCognitoUser, res: Response, next: NextFunction) => {
        const usersRepository = new UsersDrizzleRepository();
        const authHeader = req.headers.authorization;
        
        // Must have a token
        if (!authHeader?.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Authentication required" });
        }
        
        try {
          const token = authHeader.slice(7);
          const payload = await cognitoJwtVerifier.verify(token);
          
          // Attach user info
          req.cognitoUser = {
            id: payload.sub,
            email: payload.email as string | undefined,
          };
          
          // Check if user is admin in database
          const dbUser: User | undefined = await usersRepository.getUserByCognitoSub(payload.sub);
          if (dbUser?.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
          }
          
          return next();
        } catch {
          return res.status(401).json({ error: "Invalid or expired token:" });
        }
    },
]