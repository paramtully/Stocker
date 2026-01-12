import { PageView } from "packages/domain/src/metrics";
import { DbInsertPageView, DbPageView } from "../../../../db/src/schema/pageViews.schema";

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