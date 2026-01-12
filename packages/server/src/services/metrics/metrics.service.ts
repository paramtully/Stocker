import PageViewsRepository from "server/src/repositories/interfaces/metrics/pageViews.repository";
import IMetricsService from "./IMetrics.service";
import PageView from "packages/domain/src/metrics/PageView";
import PageViewsDrizzleRepository from "server/src/repositories/drizzle/metrics/pageViews.drizzle";
import crypto from "crypto";

export default class MetricsService implements IMetricsService {
    private readonly pageViewsRepository: PageViewsRepository;

    constructor() {
        this.pageViewsRepository = new PageViewsDrizzleRepository();
    }

    async recordPageView(path: string, userId: string | undefined, sessionId: string | undefined, userAgent: string | undefined): Promise<void> {
        const pageView: PageView = {
            path: path,
            userId: userId,
            sessionId: sessionId,
            userAgent: userAgent,
        };
        await this.pageViewsRepository.recordPageView(pageView);
    }

    async getUserSession(authHeader?: string, guestUserId?: string): Promise<string> {
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            // Hash the token to create a stable, shorter session identifier
            return crypto.createHash("sha256").update(token).digest("hex");
        } else if (guestUserId) {
            // Guest user - use guestUserId as session identifier
            return guestUserId;
        }
        throw new Error("No session ID found");
    }


}