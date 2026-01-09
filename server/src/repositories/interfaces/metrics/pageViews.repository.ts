import PageView from "server/src/domain/metrics/PageView";
import { DbInsertPageView, DbPageView } from "server/src/infra/db/schema/pageViews.schema";

export default interface PageViewsRepository {
    // CRUD
    recordPageView(pageView: DbInsertPageView): Promise<PageView>;
    getRecentPageViews(limit?: number): Promise<PageView[]>;

    // Analytics queries on pageViews
    getPageViewsToday(): Promise<number>;
    getPageViewsThisWeek(): Promise<number>;
    getPageViewsTotal(): Promise<number>;
    getUniqueVisitorsToday(): Promise<number>;

    // Mappers
    toInsertPageView(pageView: PageView): DbInsertPageView;
    toDomainPageView(db: DbPageView): PageView;
}