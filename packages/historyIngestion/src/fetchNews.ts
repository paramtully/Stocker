import { NewsExternalService, NewsAlphaVantage } from "@stocker/infra/external/news";
import { NewsBucketRepository, NewsBucketS3Repository } from "@stocker/bucketRepository";
import { NewsHistoryStatus, NewsSummary } from "@stocker/domain/news";
import NewsArticle from "@stocker/domain/news/newsArticle";

export async function fetchHistoricalNews(tickers: string[]): Promise<void> {
    console.log(`Fetching historical news for ${tickers.length} tickers...`);
    
    const newsService: NewsExternalService = new NewsAlphaVantage();
    const newsBucketRepo: NewsBucketRepository = new NewsBucketS3Repository();

    let newsArticlesRecord: Record<string, NewsArticle[]>;
    let newsSummaries: NewsSummary[];
    
    // get all historical news articles (if in bucket, get from bucket, if not, fetch from external service and save to bucket)
    try {
        newsArticlesRecord = await newsBucketRepo.getRawHistoricalArticles(tickers);
        if (!newsArticlesRecord) {
            newsArticlesRecord = await newsService.getAllHistoricalNewsArticles(tickers);
            if (!newsArticlesRecord) {
                throw new Error(`No historical news articles found`);
            }
            await newsBucketRepo.saveRawHistoricalArticles(newsArticlesRecord);
        }
    } catch (error) {
       throw new Error(`Error fetching historical news articles: ${error}`);
    }

    // get all news summaries
    try { 
        newsSummaries = await newsService.getNewsSummaries(Object.values(newsArticlesRecord).flat() as NewsArticle[]);
        if (!newsSummaries) {
            throw new Error(`No news summaries found`);
        }
    } catch (error) {
        throw new Error(`Error fetching news summaries: ${error}`);
    }   
        
        // Process articles through LLM and create summaries
        const allArticles = Object.values(newsArticlesRecord).flat();
        console.log(`Processing ${allArticles.length} articles through LLM...`);
        
        if (allArticles.length > 0) {
            // Process in batches to avoid overwhelming the LLM service
            const batchSize = 10;
            
            for (let i = 0; i < allArticles.length; i += batchSize) {
                const batch = allArticles.slice(i, i + batchSize);
                const batchNum = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(allArticles.length / batchSize);
                console.log(`Processing batch ${batchNum} of ${totalBatches} (${batch.length} articles)...`);
                
                // Process batch - this saves to database
                await newsProcessingService.addNewsSummary(batch);
                
                // Get the date range for this batch to retrieve summaries
                const batchDates = new Set(batch.map(a => a.publishDate.toISOString().split("T")[0]));
                
                // Retrieve summaries from database for these dates and save to S3
                for (const dateStr of batchDates) {
                    const date = new Date(dateStr);
                    // Get summaries for this date from all tickers
                    const tickers = [...new Set(batch.map(a => a.ticker))];
                    const summariesByTicker = await newsRepository.getNewsSummariesByTickers(tickers);
                    
                    // Filter summaries by date and flatten
                    const summariesForDate = Object.values(summariesByTicker)
                        .flat()
                        .filter(summary => summary.publishDate.toISOString().split("T")[0] === dateStr);
                    
                    if (summariesForDate.length > 0) {
                        await newsBucketRepo.saveProcessedSummaries(date, summariesForDate);
                        console.log(`Saved ${summariesForDate.length} processed summaries to S3 for ${dateStr}`);
                    }
                }
            }
            
            console.log("All news summaries processed and saved to database and S3");
        }
        
        // Update news history status to mark as complete
        console.log("Updating news history status...");
        for (const status of incompleteStatuses) {
            const updatedStatus: NewsHistoryStatus = {
                ...status,
                isHistoryComplete: true,
            };
            await newsHistoryStatusRepository.updateNewsHistoryStatus(updatedStatus);
            console.log(`Marked ${status.ticker} as complete`);
        }
        
        console.log("\nHistorical news population complete!");
    } catch (error) {
        console.error("Error in historical news population:", error);
        throw error;
    }
}

