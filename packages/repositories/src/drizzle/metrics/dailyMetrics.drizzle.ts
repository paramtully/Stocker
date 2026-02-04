import { db } from "../../../../db/src/db";
import DailyMetricsRepository from "../../interfaces/metrics/dailyMetrics.repository";
import { desc } from "drizzle-orm";
import { dailyMetrics, DbDailyMetrics, DbInsertDailyMetrics } from "../../../../db/src/schema/dailyMetrics.schema";
import { DailyMetrics } from "packages/domain/src/metrics";


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
