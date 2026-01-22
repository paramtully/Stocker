import { NewsFallbackService } from "@stocker/infra/external/news";
import { NewsBucketS3ParquetRepository, NewsErrorManifest } from "@stocker/bucketRepository";
import { NewsDrizzleRepository } from "@stocker/repositories/drizzle/news";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import NewsArticle from "@stocker/domain/news/newsArticle";

/**
 * Lambda handler for daily news ingestion
 * Triggered by EventBridge (daily at 8am EST)
 * 
 * Fetches today's news articles and saves to S3 (year-based parquet)
 * Unlike candles, news may not exist every day - this is expected
 */
export async function handler(): Promise<void> {
    console.log("Starting daily news ingestion...");

    try {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Get all tickers from database
        const stockRepository: StocksRepository = new StocksDrizzleRepository();
        const stocks = await stockRepository.getStocks();
        const tickers = stocks.map(stock => stock.ticker);

        if (tickers.length === 0) {
            console.log("No tickers found in database");
            return;
        }

        console.log(`Processing ${tickers.length} tickers for ${today.toISOString().split("T")[0]}`);

        // Get latest article date from database (or use yesterday as fallback)
        const newsRepository = new NewsDrizzleRepository();
        let latestArticleDate: Date;
        try {
            latestArticleDate = await newsRepository.getDateofLatestNewsSummary();
            // If no articles exist, use yesterday
            if (latestArticleDate.getTime() === 0) {
                latestArticleDate = new Date();
                latestArticleDate.setDate(latestArticleDate.getDate() - 1);
            }
        } catch {
            // Fallback to yesterday
            latestArticleDate = new Date();
            latestArticleDate.setDate(latestArticleDate.getDate() - 1);
        }

        console.log(`Fetching articles since ${latestArticleDate.toISOString().split("T")[0]}`);

        // Initialize services
        const newsService = new NewsFallbackService();
        const newsBucketRepo = new NewsBucketS3ParquetRepository();

        // Create error manifest
        const dateStr = today.toISOString().split("T")[0];
        const errorManifest: NewsErrorManifest = {
            date: dateStr,
            dataType: 'news-raw',
            errors: [],
            partialSuccess: []
        };

        // Fetch today's articles with fallback
        console.log("Fetching latest news articles...");
        const articlesRecord = await newsService.getAllLatestNewsArticles(tickers, latestArticleDate);
        
        // Flatten articles
        const allArticles: NewsArticle[] = [];
        for (const [ticker, articles] of Object.entries(articlesRecord)) {
            if (articles && articles.length > 0) {
                allArticles.push(...articles);
                errorManifest.partialSuccess.push({
                    ticker,
                    date: dateStr,
                    recordCount: articles.length
                });
            } else {
                errorManifest.errors.push({
                    ticker,
                    date: dateStr,
                    error: "No articles returned from API",
                    retryCount: 0,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Save today's articles to current year file (read, merge, write)
        if (allArticles.length > 0) {
            console.log(`Saving ${allArticles.length} articles to year file ${currentYear}...`);
            await newsBucketRepo.updateYearFileWithRawArticles(currentYear, allArticles);
            console.log(`✓ Saved to year file`);
        } else {
            console.log("No new articles found today");
        }

        // Save error manifest
        await newsBucketRepo.saveErrorManifest(errorManifest);

        // Log provider errors if any
        const errorLog = newsService.getErrorLog();
        if (errorLog.length > 0) {
            console.warn(`⚠ ${errorLog.length} provider errors encountered`);
        }

        console.log("✅ Daily news ingestion complete!");
    } catch (error) {
        console.error("❌ Error in daily news ingestion:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

