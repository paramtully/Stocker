import NewsBucketRepository from "./newsBucket.repository";
import BucketExternalService from "@stocker/infra/external/bucket/bucket.external";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";
import { BucketS3 } from "@stocker/infra/external/bucket";

export default class NewsBucketS3Repository implements NewsBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rawRootKey: string = `news/raw`;
    private readonly processedRootKey: string = `news/processed`;
    private readonly historicalRawKey: string = `${this.rawRootKey}/historical/historical.json`;
    private readonly historicalProcessedKey: string = `${this.processedRootKey}/historical/historical.json`;

    constructor() {
        this.bucketService = new BucketS3();
    }

    async saveRawHistoricalArticles(articles: NewsArticle[]): Promise<void> {
        const data = JSON.stringify(articles, this.dateReplacer);
        await this.bucketService.putObject(this.historicalRawKey, data, "application/json");
    }

    async getRawHistoricalArticles(): Promise<NewsArticle[] | null> {
        const data = await this.bucketService.getObject(this.historicalRawKey);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as NewsArticle[];
    }

    async saveProcessedHistoricalSummaries(summaries: NewsSummary[]): Promise<void> {
        const data = JSON.stringify(summaries, this.dateReplacer);
        await this.bucketService.putObject(this.historicalProcessedKey, data, "application/json");
    }

    async getProcessedHistoricalSummaries(): Promise<NewsSummary[] | null> {
        const data = await this.bucketService.getObject(this.historicalProcessedKey);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as NewsSummary[];
    }
    
    async saveRawDailyArticles(date: Date, articles: NewsArticle[]): Promise<void> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.rawRootKey}/daily/${dateStr}_articles.json`;
        const data = JSON.stringify(articles, this.dateReplacer);
        await this.bucketService.putObject(key, data, "application/json");
    }

    async getRawDailyArticles(date: Date): Promise<NewsArticle[] | null> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.rawRootKey}/daily/${dateStr}_articles.json`;
        const data = await this.bucketService.getObject(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as NewsArticle[];
    }
    
    async saveProcessedDailySummaries(date: Date, summaries: NewsSummary[]): Promise<void> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.processedRootKey}/daily/${dateStr}_summaries.json`;
        const data = JSON.stringify(summaries, this.dateReplacer);
        await this.bucketService.putObject(key, data, "application/json");
    }

    async getProcessedSummaries(date: Date): Promise<NewsSummary[] | null> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.processedRootKey}/daily/${dateStr}_summaries.json`;
        const data = await this.bucketService.getObject(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as NewsSummary[];
    }

    private dateReplacer(_key: string, value: unknown): unknown {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }

    private dateReviver(_key: string, value: unknown): unknown {
        // Check if value is a date string (ISO format)
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
        }
        return value;
    }
}

