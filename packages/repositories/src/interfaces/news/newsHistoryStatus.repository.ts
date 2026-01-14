import { NewsHistoryStatus } from "@stocker/domain/news";
import { DbNewsHistoryStatus } from "../../../../db/src/schema/newsHistoryStatus.schema";

export default interface NewsHistoryStatusRepository {
    getNewsHistoryStatuses(): Promise<NewsHistoryStatus[]>;
    insertNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void>;
    updateNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void>;
    toDomainNewsHistoryStatus(db: DbNewsHistoryStatus): NewsHistoryStatus;
    toDbNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): DbNewsHistoryStatus;
}