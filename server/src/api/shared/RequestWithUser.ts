import { UserRole } from "server/src/domain/user";
import { Request } from "express";

export interface RequestWithUser extends Request {
    user: { 
        id: string, 
        email?: string, 
        username?: string, 
        password?: string,
        role: UserRole,
    };
}