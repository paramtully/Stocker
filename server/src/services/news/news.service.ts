import { NewsSummary } from "server/src/domain/news";

export default interface NewsService {
    getNewsArticles(tickers: string[]): Promise<NewsSummary[]>;             // get news articles for a stock from database
    getLatestNewsSummary(ticker: string): Promise<NewsSummary | null>;      // get latest news summary for a stock from database
    getNewsSummaries(tickers: string[]): Promise<NewsSummary[]>;            // get news summaries for all user stocks from database
    fetchAndUpdateNewsSummaries(): Promise<void>;                           // update news summaries for all stocks from vantage news api
}