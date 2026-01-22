import { NewsFallbackService } from "@stocker/infra/external/news";
import { NewsBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { NewsSummarizationService } from "@stocker/infra/services";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { BucketS3 } from "@stocker/infra/external/bucket";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";

interface Checkpoint {
    lastProcessedTicker?: string;
    lastProcessedYear?: number;
    startedAt: string;
    lastUpdated: string;
    totalTickers: number;
    processedTickers: number;
    articlesFetched: number;
    summariesGenerated: number;
}

async function saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const bucketService = new BucketS3();
    const key = `checkpoints/news-historical-load-checkpoint.json`;
    await bucketService.putObject(key, JSON.stringify(checkpoint, null, 2), "application/json");
}

async function loadCheckpoint(): Promise<Checkpoint | null> {
    const bucketService = new BucketS3();
    const key = `checkpoints/news-historical-load-checkpoint.json`;
    try {
        const data = await bucketService.getObject(key);
        if (!data) return null;
        return JSON.parse(data) as Checkpoint;
    } catch {
        return null;
    }
}

async function saveErrorLog(errorLog: any[], type: 'news' | 'llm'): Promise<void> {
    if (errorLog.length === 0) return;
    
    const bucketService = new BucketS3();
    const key = `errors/news/${type === 'news' ? 'raw' : 'summarization'}/provider-errors-${Date.now()}.json`;
    await bucketService.putObject(key, JSON.stringify(errorLog, null, 2), "application/json");
}

async function main() {
    console.log("Starting historical news data load...");
    
    try {
        // Get all stocks from database
        const stockRepository: StocksRepository = new StocksDrizzleRepository();
        const stocks = await stockRepository.getStocks();
        const tickers = stocks.map(stock => stock.ticker);
        
        console.log(`Found ${tickers.length} stocks to load`);
        
        if (tickers.length === 0) {
            console.log("No stocks found in database. Please add stocks first.");
            process.exit(1);
        }

        // Load checkpoint if exists
        let checkpoint = await loadCheckpoint();
        const startIndex = checkpoint ? tickers.findIndex(t => t === checkpoint!.lastProcessedTicker) + 1 : 0;
        
        if (checkpoint) {
            console.log(`Resuming from checkpoint: ${checkpoint.lastProcessedTicker} (${startIndex}/${tickers.length})`);
        } else {
            checkpoint = {
                startedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalTickers: tickers.length,
                processedTickers: 0,
                articlesFetched: 0,
                summariesGenerated: 0,
            };
        }

        // Initialize services
        const newsService = new NewsFallbackService();
        const newsBucketRepo = new NewsBucketS3ParquetRepository();
        const summarizationService = new NewsSummarizationService();

        // Process tickers
        for (let i = startIndex; i < tickers.length; i++) {
            const ticker = tickers[i];
            console.log(`\n[${i + 1}/${tickers.length}] Processing ${ticker}...`);

            try {
                // Fetch historical articles with fallback
                const articlesRecord = await newsService.getAllHistoricalNewsArticles([ticker]);
                const articles = articlesRecord[ticker] || [];

                if (articles.length > 0) {
                    // Save raw articles to S3 (year-based files)
                    await newsBucketRepo.saveRawHistoricalArticles(articles);
                    console.log(`  ✓ Saved ${articles.length} raw articles for ${ticker}`);
                    checkpoint.articlesFetched += articles.length;

                    // Summarize articles
                    console.log(`  Processing ${articles.length} articles through LLM...`);
                    const { summaries, failedArticles } = await summarizationService.summarizeArticles(articles);

                    if (summaries.length > 0) {
                        // Save summaries to S3 (year-based files)
                        await newsBucketRepo.saveProcessedHistoricalSummaries(summaries);
                        console.log(`  ✓ Generated ${summaries.length} summaries for ${ticker}`);
                        checkpoint.summariesGenerated += summaries.length;
                    }

                    if (failedArticles.length > 0) {
                        console.warn(`  ⚠ Failed to summarize ${failedArticles.length} articles for ${ticker}`);
                    }
                } else {
                    console.warn(`  ⚠ No articles found for ${ticker}`);
                }

                // Update checkpoint
                checkpoint.lastProcessedTicker = ticker;
                checkpoint.processedTickers = i + 1;
                checkpoint.lastUpdated = new Date().toISOString();
                
                // Save checkpoint every 10 tickers
                if ((i + 1) % 10 === 0) {
                    await saveCheckpoint(checkpoint);
                    console.log(`  ✓ Checkpoint saved`);
                }

            } catch (error) {
                console.error(`  ✗ Error processing ${ticker}:`, error);
                // Continue with next ticker
            }
        }

        // Save final checkpoint
        checkpoint.processedTickers = tickers.length;
        checkpoint.lastUpdated = new Date().toISOString();
        await saveCheckpoint(checkpoint);

        // Save error logs
        const newsErrorLog = newsService.getErrorLog();
        if (newsErrorLog.length > 0) {
            await saveErrorLog(newsErrorLog, 'news');
            console.log(`\n⚠ Saved ${newsErrorLog.length} news API errors to S3`);
        }

        const llmErrorLog = summarizationService.getErrorLog();
        if (llmErrorLog.length > 0) {
            await saveErrorLog(llmErrorLog, 'llm');
            console.log(`⚠ Saved ${llmErrorLog.length} LLM errors to S3`);
        }

        console.log(`\n✅ Historical news data load complete!`);
        console.log(`   Articles fetched: ${checkpoint.articlesFetched}`);
        console.log(`   Summaries generated: ${checkpoint.summariesGenerated}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in historical load:", error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

