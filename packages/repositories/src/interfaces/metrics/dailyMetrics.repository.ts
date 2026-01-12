import { DailyMetrics } from "packages/domain/src/metrics";
import { DbDailyMetrics, DbInsertDailyMetrics } from "../../../../db/src/schema/dailyMetrics.schema";

export default interface DailyMetricsRepository {
    // CRUD
    recordDailyMetrics(metrics: DbInsertDailyMetrics): Promise<DailyMetrics>;
    
    // Analytics queries on dailyMetrics
    getDailyMetrics(daysBack?: number): Promise<DailyMetrics[]>;
    
    // Mappers
    toInsertDailyMetrics(dailyMetrics: DailyMetrics): DbInsertDailyMetrics;
    toDomainDailyMetrics(db: DbDailyMetrics): DailyMetrics;
}