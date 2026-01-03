import { Response } from "express";
import { MetricsService, IMetricsService } from "server/src/services/metrics/";
import getUserId from "../shared/getUser";
import { RequestWithCognitoUser } from "../shared/types";

const metricsService: IMetricsService = new MetricsService();

export const trackController = {
    trackPageview: async (req: RequestWithCognitoUser, res: Response) => {
        try {
            const { path } = req.body;
            if (!path || typeof path !== "string") {
              return res.status(400).json({ error: "Path is required" });
            }
            
            const userId = getUserId(req);
            // session id is either the bearer token hash or the guest user id
            const sessionId = await metricsService.getUserSession(req.headers.authorization, req.guestUserId);
      
            await metricsService.recordPageView(path, userId, sessionId, req.headers["user-agent"] ?? undefined);
            return res.json({ success: true });
        } catch (error) {
            console.error("Error tracking page view:", error);
            return res.status(500).json({ error: "Failed to track page view" });
        }
    },
}