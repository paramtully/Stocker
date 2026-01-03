import { Request } from "express";

// Extend Request type
export interface RequestWithCognitoUser extends Request {
    cognitoUser?: { id: string; email?: string };
    guestUserId?: string;
}