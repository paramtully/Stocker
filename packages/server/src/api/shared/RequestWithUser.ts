import { UserRole } from "packages/domain/src/user";
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