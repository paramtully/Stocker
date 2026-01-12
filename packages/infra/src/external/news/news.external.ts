import NewsArticle from "packages/domain/src/news/newsArticle";
import NewsHistoryStatus from "packages/domain/src/news/newsHistoryStatus";

export default interface NewsExternalService {
    getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>>;
    getAllHistoricalNewsArticles(historyStatuses: NewsHistoryStatus[]): Promise<Record<string, NewsArticle[]>>;
}