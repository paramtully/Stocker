import { UserRole } from "server/src/domain/user/index";
import { Request } from "express";

export default interface AuthExternalService {
    // verify token should on ly be called when the req is not intercepted
    verifyToken(header: string): Promise<{id: string, username?: string, email?: string, role: UserRole} | undefined>;
    addUser(username: string, role: string, password?: string): Promise<{id: string, password: string}>;   // return id of the user
    initiateAuth(username: string, password: string): Promise<{ accessToken: string, idToken: string, expiresIn: number }>;
    // the is intercepted flag allows for the case to be handled where the auth data is moved to a different location within the request object.
    getUserFromRequest(req: Request, isIntercepted?: boolean): Promise<{id: string, username?: string, email?: string, role: UserRole} | undefined>; 
}