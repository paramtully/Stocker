import NewsArticle from "@stocker/domain/news/newsArticle";

export default abstract class NewsExternalService {
    abstract getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>>;
    abstract getAllHistoricalNewsArticles(tickers: string[]): Promise<Record<string, NewsArticle[]>>;
}