import NewsArticle from "server/src/domain/news/newsArticle";
import NewsHistoryStatus from "server/src/domain/news/newsHistoryStatus";

export default interface NewsExternalService {
    getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>>;
    getAllHistoricalNewsArticles(historyStatuses: NewsHistoryStatus[]): Promise<Record<string, NewsArticle[]>>;
}