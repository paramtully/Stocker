import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";

export default interface NewsBucketRepository {
    saveRawHistoricalArticles(articles: NewsArticle[]): Promise<void>;
    getRawHistoricalArticles(): Promise<NewsArticle[] | null>;
    saveProcessedHistoricalSummaries(summaries: NewsSummary[]): Promise<void>;
    getProcessedHistoricalSummaries(): Promise<NewsSummary[] | null>;
    saveRawDailyArticles(date: Date, articles: NewsArticle[]): Promise<void>;
    getRawDailyArticles(date: Date): Promise<NewsArticle[] | null>;
    saveProcessedDailySummaries(date: Date, summaries: NewsSummary[]): Promise<void>;
    getProcessedDailySummaries(date: Date): Promise<NewsSummary[] | null>;
}

