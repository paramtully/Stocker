import { db } from "server/src/infra/db/db";
import DailyMetricsRepository from "server/src/repositories/interfaces/metrics/dailyMetrics.repository";
import DailyMetrics from "server/src/domain/metrics/dailyMetrics";
import { dailyMetrics, DbDailyMetrics, DbInsertDailyMetrics } from "server/src/infra/db/schema/dailyMetrics.schema";
import { desc } from "drizzle-orm";

export default class DailyMetricsDrizzleRepository implements DailyMetricsRepository {
    async recordDailyMetrics(metrics: DbInsertDailyMetrics): Promise<DailyMetrics> {
        const [newDailyMetrics] = await db.insert(dailyMetrics).values(metrics).returning();
        return this.toDomainDailyMetrics(newDailyMetrics as DbDailyMetrics);
    }

    async getDailyMetrics(daysBack?: number): Promise<DailyMetrics[]> {
        const result = await db.select().from(dailyMetrics).orderBy(desc(dailyMetrics.date)).limit(daysBack ?? 30);
        return result.map(this.toDomainDailyMetrics);
    }

    toInsertDailyMetrics(dailyMetrics: DailyMetrics): DbInsertDailyMetrics {
        return {
            date: dailyMetrics.date,
            totalVisits: dailyMetrics.totalVisits ?? 0,
            uniqueVisitors: dailyMetrics.uniqueVisitors ?? 0,
            signups: dailyMetrics.signups ?? 0,
        };
    }

    toDomainDailyMetrics(db: DbDailyMetrics): DailyMetrics {
        return {
            date: db.date,
            totalVisits: db.totalVisits ?? 0,
            uniqueVisitors: db.uniqueVisitors ?? 0,
            signups: db.signups ?? 0,
        };
    }
}
