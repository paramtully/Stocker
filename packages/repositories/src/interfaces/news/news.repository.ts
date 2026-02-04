import { NewsSummary } from "packages/domain/src/news";
import { DbNewsSummary, DbInsertNewsSummary } from "../../../../db/src/schema/newsSummary.schema";

export default interface NewsRepository {
    getNewsSummaries(ticker: string): Promise<NewsSummary[]>;
    getLatestNewsSummary(ticker: string): Promise<NewsSummary | null>;
    getTickerNewsSummaries(ticker: string): Promise<NewsSummary[]>;
    getNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>>;
    getTodaysNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>>;
    getNewsSummariesPageByTickers(tickers: string[], limit: number, offset: number, ticker?: string): Promise<{ articles: NewsSummary[]; total: number }>;
    insertNewsSummary(news: NewsSummary[]): Promise<void>;
    getEarliestArticleDate(tickers: string[]): Promise<Record<string, Date>>;
    getDateofLatestNewsSummary(): Promise<Date>;
    toDomainNewsSummary(db: DbInsertNewsSummary | DbNewsSummary): NewsSummary;
    toDbInsertNewsSummary(newsSummary: NewsSummary): DbInsertNewsSummary;
}