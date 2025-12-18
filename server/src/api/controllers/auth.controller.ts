import { Request, Response, NextFunction } from "express";

export const authController = {
    getAuthUser: async (req: Request, res: Response) => {
        // stub
        return res.json(null);
    },
    getAuthStatus: async (req: Request, res: Response) => {
        // stub
        return res.json(null);
    },
    ensureUserIsAuthenticated: async (req: Request, res: Response, next: NextFunction) => {
        // stub
        return next();
    },
}