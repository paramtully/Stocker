// server/middleware/cognitoAuth.ts
import { Response, NextFunction } from "express";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import User from "server/src/domain/user";
import { cognitoJwtVerifier } from "../shared/cognito";
import { RequestWithCognitoUser } from "../shared/types";


// Middleware to ensure user has a session (authenticated or guest)
export const cognitoVerify = [
    // ensure User: authenticated or guest
    async (req: RequestWithCognitoUser, res: Response, next: NextFunction) => {
        const usersRepository = new UsersDrizzleRepository();

        const authHeader = req.headers.authorization;
        
        // Try to validate JWT token if present
        if (authHeader?.startsWith("Bearer ")) {
            try {
            const token = authHeader.slice(7);
            const payload = await cognitoJwtVerifier.verify(token);
            
            // Attach authenticated user info
            req.cognitoUser = {
                id: payload.sub,
                email: payload.email as string | undefined,
            };
            
            // Ensure user exists in database
            let dbUser = await usersRepository.getUserByCognitoSub(payload.sub);
            if (!dbUser) {
                dbUser = await usersRepository.insertUser({
                cognitoSub: payload.sub,
                email: payload.email as string,
                name: { first: payload.given_name as string, last: payload.family_name as string },
                role: "user",
                emailPreferences: { enabled: true, deliveryHour: 8 },
                });
            }
            
            return next();
            } catch (err) {
            // Invalid/expired token - fall through to guest handling
            console.warn("Invalid JWT token:", err);
            }
        }
        
        // Handle as guest user
        const guestId = req.cookies?.guestId;
        
        if (!guestId) {

            // Create guest user in database
            const guestUser: User = await usersRepository.createGuestUser();
            
            // Set cookie (30 days)
            res.cookie("guestId", guestUser.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
        }
        
        req.guestUserId = guestId;
        return next();
    },
]

