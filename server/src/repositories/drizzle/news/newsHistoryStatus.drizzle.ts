import { eq } from "drizzle-orm";
import NewsHistoryStatus from "server/src/domain/news/newsHistoryStatus";
import { db } from "server/src/infra/db/db";
import { DbNewsHistoryStatus, newsHistoryStatuses } from "server/src/infra/db/schema/newsHistoryStatus.schema";
import NewsHistoryStatusesRepository from "server/src/repositories/interfaces/news/newsHistoryStatus.repository";


export default class NewsHistoryStatusesDrizzleRepository implements NewsHistoryStatusesRepository {
    async getNewsHistoryStatuses(): Promise<NewsHistoryStatus[]> {
        const dbNewsHistoryStatuses: DbNewsHistoryStatus[] = await db.select().from(newsHistoryStatuses);
        return dbNewsHistoryStatuses.map(this.toDomainNewsHistoryStatus);
    }

    async insertNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void> {
        await db.insert(newsHistoryStatuses).values(this.toDbNewsHistoryStatus(newsHistoryStatus));
    }

    async updateNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): Promise<void> {
        await db.update(newsHistoryStatuses).set(this.toDbNewsHistoryStatus(newsHistoryStatus)).where(eq(newsHistoryStatuses.ticker, newsHistoryStatus.ticker));
    }

    toDomainNewsHistoryStatus(db: DbNewsHistoryStatus): NewsHistoryStatus {
        return {
            ticker: db.ticker,
            isHistoryComplete: db.isHistoryComplete,
        };
    }

    toDbNewsHistoryStatus(newsHistoryStatus: NewsHistoryStatus): DbNewsHistoryStatus {
        return {
            ticker: newsHistoryStatus.ticker,
            isHistoryComplete: newsHistoryStatus.isHistoryComplete,
        };
    }

}