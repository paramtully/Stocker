import { RequestWithUser } from "./RequestWithUser";
import { Request } from "express";

// Helper to get user ID from request (authenticated or guest)
export default function getUserId(req: Request): string | undefined {
    return (req as RequestWithUser).user?.id;
}