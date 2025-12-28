import { NewsHistoryStatus } from "server/src/domain/news";
import { DbNewsHistoryStatus } from "server/src/infra/db/schema/newsHistoryStatus.schema";

export default interface NewsHistoryStatusRepository {
    getNewsHistoryStatuses(): Promise<NewsHistoryStatus[]>;
    insertNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void>;
    updateNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void>;
    toDomainNewsHistoryStatus(db: DbNewsHistoryStatus): NewsHistoryStatus;
    toDbNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): DbNewsHistoryStatus;
}