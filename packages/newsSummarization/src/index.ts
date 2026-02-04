import { NewsSummarizationService } from "@stocker/infra/services";
import { NewsBucketS3ParquetRepository, NewsErrorManifest } from "@stocker/bucketRepository";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";

/**
 * Lambda handler for news summarization
 * Triggered by S3 PutObject on news/raw/year/*.parquet OR EventBridge (daily after ingestion)
 * 
 * Reads raw articles from S3, filters out already-summarized articles,
 * batches them by token limits, calls LLM with fallback, and saves summaries
 */
export async function handler(): Promise<void> {
    console.log("Starting news summarization...");

    try {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Calculate date range: last 7 days (rolling window)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        console.log(`Processing articles from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

        // Initialize services
        const newsBucketRepo = new NewsBucketS3ParquetRepository();
        const summarizationService = new NewsSummarizationService();

        // Read raw articles from year files for date range
        const rawArticles = await newsBucketRepo.getRawArticlesForDateRange(startDate, endDate);

        if (rawArticles.length === 0) {
            console.log("No raw articles found in date range");
            return;
        }

        console.log(`Found ${rawArticles.length} raw articles`);

        // Read existing summaries to filter out already-processed articles
        const existingSummaries = await newsBucketRepo.getSummariesForDateRange(startDate, endDate);
        const existingUrls = new Set(existingSummaries.map(s => s.articleUrl));

        // Filter out already-summarized articles
        const articlesToProcess = rawArticles.filter(a => !existingUrls.has(a.url));

        if (articlesToProcess.length === 0) {
            console.log("All articles already summarized");
            return;
        }

        console.log(`Processing ${articlesToProcess.length} new articles (${rawArticles.length - articlesToProcess.length} already summarized)`);

        // Create error manifest
        const dateStr = today.toISOString().split("T")[0];
        const errorManifest: NewsErrorManifest = {
            date: dateStr,
            dataType: 'news-summarization',
            errors: [],
            partialSuccess: []
        };

        // Summarize articles in batches
        const { summaries, failedArticles } = await summarizationService.summarizeArticles(articlesToProcess);

        // Group summaries by year for efficient saving
        const summariesByYear = new Map<number, NewsSummary[]>();
        for (const summary of summaries) {
            const year = summary.publishDate.getFullYear();
            if (!summariesByYear.has(year)) {
                summariesByYear.set(year, []);
            }
            summariesByYear.get(year)!.push(summary);
        }

        // Save summaries to year files
        for (const [year, yearSummaries] of summariesByYear) {
            console.log(`Saving ${yearSummaries.length} summaries to year file ${year}...`);
            await newsBucketRepo.updateYearFileWithSummaries(year, yearSummaries);
            console.log(`  ✓ Saved to year file ${year}`);
        }

        // Track success/failures in error manifest
        for (const summary of summaries) {
            errorManifest.partialSuccess.push({
                articleUrl: summary.articleUrl,
                ticker: summary.ticker,
                date: summary.publishDate.toISOString().split("T")[0],
                recordCount: 1
            });
        }

        for (const article of failedArticles) {
            errorManifest.errors.push({
                articleUrl: article.url,
                ticker: article.ticker,
                date: article.publishDate.toISOString().split("T")[0],
                error: "Failed to generate summary",
                retryCount: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Save error manifest
        await newsBucketRepo.saveErrorManifest(errorManifest);

        // Log LLM errors if any
        const errorLog = summarizationService.getErrorLog();
        if (errorLog.length > 0) {
            console.warn(`⚠ ${errorLog.length} LLM provider errors encountered`);
        }

        console.log(`✅ Summarization complete! Generated ${summaries.length} summaries, ${failedArticles.length} failed`);
    } catch (error) {
        console.error("❌ Error in news summarization:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

