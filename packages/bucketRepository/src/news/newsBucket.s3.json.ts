import NewsBucketRepository from "./newsBucket.repository";
import BucketExternalService from "@stocker/infra/external/bucket/bucket.external";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";
import { BucketS3 } from "@stocker/infra/external/bucket";

export default class NewsBucketS3Repository implements NewsBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rawRootKey: string = `news/raw`;
    private readonly processedRootKey: string = `news/processed`;
    private readonly rawYearKey: string = `${this.rawRootKey}/year/`;
    private readonly processedYearKey: string = `${this.processedRootKey}/year/`;

    constructor() {
        this.bucketService = new BucketS3();
    }

    async saveRawHistoricalArticles(articles: NewsArticle[]): Promise<void> {
        if (articles.length === 0) {
            return;
        }

        // Group articles by year
        const articlesByYear = new Map<number, NewsArticle[]>();
        for (const article of articles) {
            if (!article.publishDate || isNaN(article.publishDate.getTime())) {
                throw new Error(`Invalid publishDate in article with URL ${article.url}`);
            }
            const year = article.publishDate.getFullYear();
            if (!articlesByYear.has(year)) {
                articlesByYear.set(year, []);
            }
            articlesByYear.get(year)!.push(article);
        }

        // Save each year as a separate JSON file
        for (const [year, yearArticles] of articlesByYear) {
            const key = `${this.rawYearKey}${year}.json`;
            const data = JSON.stringify(yearArticles, this.dateReplacer);
            await this.bucketService.putObject(key, data, "application/json");
        }
    }

    async getRawHistoricalArticles(): Promise<NewsArticle[] | null> {
        try {
            // List all year JSON files
            const keys = await this.bucketService.listObjects(this.rawYearKey);
            const jsonKeys = keys.filter(key => key.endsWith('.json'));

            if (jsonKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allArticles: NewsArticle[] = [];
            const errors: string[] = [];

            for (const key of jsonKeys) {
                try {
                    const data = await this.bucketService.getObject(key);
                    if (data) {
                        const articles = JSON.parse(data, this.dateReviver) as NewsArticle[];
                        allArticles.push(...articles);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read JSON file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allArticles.length === 0) {
                // If all files failed, return null
                console.error("All historical raw article JSON files failed to read:", errors);
                return null;
            }

            return allArticles.length > 0 ? allArticles : null;
        } catch (error) {
            console.error("Error reading historical raw articles from JSON:", error);
            return null;
        }
    }

    async saveProcessedHistoricalSummaries(summaries: NewsSummary[]): Promise<void> {
        if (summaries.length === 0) {
            return;
        }

        // Group summaries by year
        const summariesByYear = new Map<number, NewsSummary[]>();
        for (const summary of summaries) {
            if (!summary.publishDate || isNaN(summary.publishDate.getTime())) {
                throw new Error(`Invalid publishDate in summary with URL ${summary.articleUrl}`);
            }
            const year = summary.publishDate.getFullYear();
            if (!summariesByYear.has(year)) {
                summariesByYear.set(year, []);
            }
            summariesByYear.get(year)!.push(summary);
        }

        // Save each year as a separate JSON file
        for (const [year, yearSummaries] of summariesByYear) {
            const key = `${this.processedYearKey}${year}.json`;
            const data = JSON.stringify(yearSummaries, this.dateReplacer);
            await this.bucketService.putObject(key, data, "application/json");
        }
    }

    async getProcessedHistoricalSummaries(): Promise<NewsSummary[] | null> {
        try {
            // List all year JSON files
            const keys = await this.bucketService.listObjects(this.processedYearKey);
            const jsonKeys = keys.filter(key => key.endsWith('.json'));

            if (jsonKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allSummaries: NewsSummary[] = [];
            const errors: string[] = [];

            for (const key of jsonKeys) {
                try {
                    const data = await this.bucketService.getObject(key);
                    if (data) {
                        const summaries = JSON.parse(data, this.dateReviver) as NewsSummary[];
                        allSummaries.push(...summaries);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read JSON file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allSummaries.length === 0) {
                // If all files failed, return null
                console.error("All historical processed summary JSON files failed to read:", errors);
                return null;
            }

            return allSummaries.length > 0 ? allSummaries : null;
        } catch (error) {
            console.error("Error reading historical processed summaries from JSON:", error);
            return null;
        }
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

    async getProcessedDailySummaries(date: Date): Promise<NewsSummary[] | null> {
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

