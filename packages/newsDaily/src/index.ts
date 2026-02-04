import { NewsFallbackService } from "@stocker/infra/external/news";
import { NewsBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { BucketS3 } from "@stocker/infra/external/bucket";
import NewsArticle from "@stocker/domain/news/newsArticle";

interface CurrentListings {
    lastUpdated: string;
    currentTickers: string[];
    stockMetadata: Array<{
        ticker: string;
        companyName: string;
        marketCap: string;
        industry: string;
        exchange: string;
    }>;
}

/**
 * Lambda handler for fetching daily news articles (rolling 7-day window)
 * Triggered by EventBridge (daily, e.g., 8am EST)
 * 
 * Fetches last 7 days of news articles for all currently listed tickers and updates
 * the same year-based parquet files used by historical packages.
 */
export async function handler(): Promise<void> {
    console.log("Starting daily news data fetch...");

    try {
        const newsService = new NewsFallbackService();
        const newsBucketRepo = new NewsBucketS3ParquetRepository();
        const bucketService = new BucketS3();

        // Read tickers from S3
        const listingsKey = "listings/current-listings.json";
        console.log(`Reading tickers from S3: ${listingsKey}`);
        const listingsData = await bucketService.getObject(listingsKey);

        if (!listingsData) {
            console.error("No listings data found in S3. Cannot proceed.");
            throw new Error("No listings data found in S3");
        }

        const listings: CurrentListings = JSON.parse(listingsData);
        const tickers = listings.currentTickers;
        console.log(`Found ${tickers.length} tickers to process`);

        // Calculate date range: last 7 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0); // Start of day 7 days ago

        console.log(`Fetching news articles from ${startDate.toISOString().split("T")[0]} onwards`);

        // Fetch news articles for all tickers since startDate
        const articlesRecord = await newsService.getAllLatestNewsArticles(tickers, startDate);
        
        // Flatten all articles into a single array
        const allArticles: NewsArticle[] = [];
        for (const ticker of tickers) {
            const tickerArticles = articlesRecord[ticker] || [];
            allArticles.push(...tickerArticles);
            if (tickerArticles.length > 0) {
                console.log(`  Fetched ${tickerArticles.length} articles for ${ticker}`);
            }
        }

        if (allArticles.length === 0) {
            console.log("No articles found in date range");
            return;
        }

        console.log(`Total articles fetched: ${allArticles.length}`);

        // Group articles by year (based on publishDate)
        const articlesByYear = new Map<number, NewsArticle[]>();
        for (const article of allArticles) {
            if (!article.publishDate || isNaN(article.publishDate.getTime())) {
                console.warn(`Invalid publishDate in article with URL ${article.url}, skipping`);
                continue;
            }
            const year = article.publishDate.getFullYear();
            if (!articlesByYear.has(year)) {
                articlesByYear.set(year, []);
            }
            articlesByYear.get(year)!.push(article);
        }

        // Update year files
        console.log(`Updating ${articlesByYear.size} year file(s)...`);
        for (const [year, yearArticles] of articlesByYear) {
            try {
                console.log(`  Updating year ${year} with ${yearArticles.length} articles...`);
                await newsBucketRepo.updateYearFileWithRawArticles(year, yearArticles);
                console.log(`  ✓ Successfully updated year ${year}`);
            } catch (error) {
                console.error(`  ✗ Error updating year ${year}:`, error);
                throw error;
            }
        }

        console.log(`✅ Successfully updated ${allArticles.length} articles across ${articlesByYear.size} year file(s)`);
    } catch (error) {
        console.error("❌ Error in daily news fetch:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}
