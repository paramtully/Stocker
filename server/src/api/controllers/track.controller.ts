import { Request, Response } from "express";
import { MetricsService, IMetricsService } from "server/src/services/metrics/";

const metricsService: IMetricsService = new MetricsService();

export const trackController = {
    trackPageview: async (req: Request, res: Response) => {
        try {
            const { path } = req.body;
            if (!path || typeof path !== "string") {
              return res.status(400).json({ error: "Path is required" });
            }
      
            const userId = getUserId(req);
            const session = req.session as any;
            const sessionId = session?.id || session?.guestUserId || userId;
      
            await metricsService.recordPageView(path, userId, sessionId, req.headers["user-agent"]);
            return res.json({ success: true });
        } catch (error) {
            console.error("Error tracking page view:", error);
            return res.status(500).json({ error: "Failed to track page view" });
        }
    },
}