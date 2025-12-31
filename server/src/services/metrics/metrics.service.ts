import PageViewsRepository from "server/src/repositories/interfaces/metrics/pageViews.repository";
import IMetricsService from "./IMetrics.service";
import PageView from "server/src/domain/metrics/PageView";
import PageViewsDrizzleRepository from "server/src/repositories/drizzle/metrics/pageViews.drizzle";

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
}