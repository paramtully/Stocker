import DailyMetrics from "server/src/domain/metrics/dailyMetrics";
import { DbDailyMetrics, DbInsertDailyMetrics } from "server/src/infra/db/schema/dailyMetrics.schema";

export default interface DailyMetricsRepository {
    // CRUD
    recordDailyMetrics(metrics: DbInsertDailyMetrics): Promise<DailyMetrics>;
    
    // Analytics queries on dailyMetrics
    getDailyMetrics(daysBack?: number): Promise<DailyMetrics[]>;
    
    // Mappers
    toInsertDailyMetrics(dailyMetrics: DailyMetrics): DbInsertDailyMetrics;
    toDomainDailyMetrics(db: DbDailyMetrics): DailyMetrics;
}