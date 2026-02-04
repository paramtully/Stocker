import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";

export interface NewsErrorManifest {
    date: string;
    dataType: 'news-raw' | 'news-summarization';
    errors: Array<{
        ticker?: string;
        articleUrl?: string;
        date?: string;
        error: string;
        retryCount: number;
        timestamp: string;
    }>;
    partialSuccess: Array<{
        ticker?: string;
        articleUrl?: string;
        date?: string;
        recordCount: number;
    }>;
}

export default interface NewsBucketRepository {
    saveRawHistoricalArticles(articles: NewsArticle[]): Promise<void>;
    getRawHistoricalArticles(): Promise<NewsArticle[] | null>;
    saveProcessedHistoricalSummaries(summaries: NewsSummary[]): Promise<void>;
    getProcessedHistoricalSummaries(): Promise<NewsSummary[] | null>;
    saveRawDailyArticles(date: Date, articles: NewsArticle[]): Promise<void>;
    getRawDailyArticles(date: Date): Promise<NewsArticle[] | null>;
    saveProcessedDailySummaries(date: Date, summaries: NewsSummary[]): Promise<void>;
    getProcessedDailySummaries(date: Date): Promise<NewsSummary[] | null>;
    
    // New methods for year-only file updates
    updateYearFileWithRawArticles(year: number, articles: NewsArticle[]): Promise<void>;
    updateYearFileWithSummaries(year: number, summaries: NewsSummary[]): Promise<void>;
    getRawArticlesForDateRange(startDate: Date, endDate: Date): Promise<NewsArticle[]>;
    getSummariesForDateRange(startDate: Date, endDate: Date): Promise<NewsSummary[]>;
    
    // Error manifest methods
    getErrorManifest(date: Date, dataType: 'raw' | 'summarization'): Promise<NewsErrorManifest | null>;
    saveErrorManifest(manifest: NewsErrorManifest): Promise<void>;
}

