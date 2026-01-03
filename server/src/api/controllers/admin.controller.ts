import { Request, Response } from "express";
import { AdminService, IAdminService } from "server/src/services/admin";
import getUserId from "../shared/getUser";

const adminService: IAdminService = new AdminService();

export const adminController = {
    checkAdmin: async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "User is not authenticated" });
        }
        const isAdmin = await adminService.checkAdmin(userId);
        return res.json(isAdmin);
    },
    getAdminMetrics: async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId || !(await adminService.checkAdmin(userId))) {
            return res.status(401).json({ error: "User is not authorized to access this resource" });
        }
        const adminMetrics = await adminService.getAdminMetrics();
        return res.json(adminMetrics);
    },
}
