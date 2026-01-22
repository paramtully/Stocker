import { NextFunction, Response, Request } from "express";
import { AuthExternalService, AuthCognitoClient } from "server/src/infra/external/auth/aws";
import { RequestWithUser } from "../shared/RequestWithUser";
import { UserRole } from "packages/domain/src/user";
import { v4 as uuid } from "uuid";
import { AuthService, IAuthService } from "server/src/services/auth/";

const authExternalService: AuthExternalService = new AuthCognitoClient();
const authService: IAuthService = new AuthService();

export const unInterceptedUserHandler = [
    // gets user from request and moves it to the request object, or create guest user
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await authExternalService.getUserFromRequest(req, false);

        if (!user) {
            try {
                const role = "guest";
                const username = `${role}_${uuid()}`;
                const password = uuid();
                const guestUser = await authExternalService.addUser(username, role, password);
                (req as RequestWithUser).user = {
                    id: guestUser.id,
                    username: username,
                    password: password,
                    role: role as UserRole,
                };
            } catch (error) {
                console.error("Error creating guest user:", error);
                return res.status(500).json({ error: "Internal server error" });
            }
        } else {
            (req as RequestWithUser).user = {
                id: user?.id,
                username: user?.username,
                email: user?.email,
                role: user?.role as UserRole,
            };
        }

        return next();
    },
    // add user to database if not already in database
    async (req: Request, res: Response, next: NextFunction) => {
        const reqUser = (req as RequestWithUser).user;
        const user = await authService.getUserById(reqUser.id);
        if (!user) {
            await authService.insertUser({
                id: reqUser.id,
                email: reqUser.email as string,
                role: reqUser.role,
                emailPreferences: {
                    enabled: reqUser.role === "guest" ? false : true,
                    deliveryHour: 8,
                },
            });
        }
        return next()
    },
    // give authorization header to the user if newly created guest user
    async (req: Request, res: Response) => {
        const reqUser = (req as RequestWithUser).user;
        if (reqUser.role === "guest" && reqUser.username && reqUser.password) {
            const tokens = await authExternalService.initiateAuth(reqUser.username, reqUser.password);
            res.setHeader("Authorization", `Bearer ${tokens.accessToken}`);
        }
        return res.status(200).json({ message: "User authenticated successfully" });
    },
]

// Middleware for signup endpoint - uses first two handlers but allows controller to handle response
export const signupUserHandler = [
    // gets user from request and moves it to the request object, or create guest user
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await authExternalService.getUserFromRequest(req, false);

        if (!user) {
            try {
                const role = "guest";
                const username = `${role}_${uuid()}`;
                const password = uuid();
                const guestUser = await authExternalService.addUser(username, role, password);
                (req as RequestWithUser).user = {
                    id: guestUser.id,
                    username: username,
                    password: password,
                    role: role as UserRole,
                };
            } catch (error) {
                console.error("Error creating guest user:", error);
                return res.status(500).json({ error: "Internal server error" });
            }
        } else {
            (req as RequestWithUser).user = {
                id: user?.id,
                username: user?.username,
                email: user?.email,
                role: user?.role as UserRole,
            };
        }

        return next();
    },
    // add user to database if not already in database
    async (req: Request, res: Response, next: NextFunction) => {
        const reqUser = (req as RequestWithUser).user;
        const user = await authService.getUserById(reqUser.id);
        if (!user) {
            await authService.insertUser({
                id: reqUser.id,
                email: reqUser.email as string,
                role: reqUser.role,
                emailPreferences: {
                    enabled: reqUser.role === "guest" ? false : true,
                    deliveryHour: 8,
                },
            });
        }
        return next()
    },
];