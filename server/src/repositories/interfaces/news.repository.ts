import { NewsSummary } from "server/src/domain/news";
import { DbNewsSummary, DbInsertNewsSummary } from "server/src/infra/db/schema/newsSummary.schema";

export default interface NewsRepository {
    getNewsSummaries(ticker: string): Promise<NewsSummary[]>;
    getLatestNewsSummary(ticker: string): Promise<NewsSummary | null>;
    getTickerNewsSummaries(ticker: string): Promise<NewsSummary[]>;
    getNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>>;
    insertNewsSummary(newsSummary: DbInsertNewsSummary): Promise<NewsSummary>;
    getEarliestArticleDate(tickers: string[]): Promise<Record<string, Date>>;
    toDomainNewsSummary(db: DbNewsSummary): NewsSummary;
    toDbInsertNewsSummary(newsSummary: NewsSummary): DbInsertNewsSummary;
}