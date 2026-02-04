import { PageView } from "packages/domain/src/metrics";
import PageViewsRepository from "../../interfaces/metrics/pageViews.repository";
import { DbInsertPageView, DbPageView, pageViews } from "../../../../db/src/schema/pageViews.schema";
import { db } from "../../../../db/src/db";
import { count, countDistinct, desc, gte } from "drizzle-orm";

export default class PageViewsDrizzleRepository implements PageViewsRepository {
    async recordPageView(pageView: DbInsertPageView): Promise<PageView> {
        const [newPageView] = await db.insert(pageViews).values(pageView).returning();
        return this.toDomainPageView(newPageView as DbPageView);
    }
    
    async getRecentPageViews(limit?: number): Promise<PageView[]> {
        const result = await db.select().from(pageViews).orderBy(desc(pageViews.occurredAt)).limit(limit ?? 50);
        return result.map(this.toDomainPageView);
    }

    async getPageViewsToday(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await db.select({ count: count() }).from(pageViews).where(gte(pageViews.occurredAt, today));
        return result[0]?.count || 0;
    }

    async getPageViewsThisWeek(): Promise<number> {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const result = await db.select({ count: count() }).from(pageViews).where(gte(pageViews.occurredAt, weekAgo));
        return result[0]?.count || 0;
    }

    async getPageViewsTotal(): Promise<number> {
        const result = await db.select({ count: count() }).from(pageViews);
        return result[0]?.count || 0;
    }

    async getUniqueVisitorsToday(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await db.select({ count: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.occurredAt, today));
        return result[0]?.count || 0;
    }


    toInsertPageView(pageView: PageView): DbInsertPageView {
        return {
            path: pageView.path,
            userId: pageView.userId ?? null,
            sessionId: pageView.sessionId,
            userAgent: pageView.userAgent ?? null,
        };
    }

    toDomainPageView(db: DbPageView): PageView {
        return {
            path: db.path,
            userId: db.userId ?? "",
            sessionId: db.sessionId ?? "",
            userAgent: db.userAgent ?? "",
        };
    }
}