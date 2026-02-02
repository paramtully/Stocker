import { NewsBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { NewsDrizzleRepository } from "@stocker/repositories/drizzle/news";
import NewsSummary from "@stocker/domain/news/newsSummary";

/**
 * Lambda handler for syncing news summaries from S3 to RDS
 * Triggered by S3 PutObject on news/processed/year/*.parquet OR EventBridge (daily after summarization)
 * 
 * Reads rolling window (last 7 days) from S3 and batch upserts to RDS
 */
export async function handler(): Promise<void> {
    console.log("Starting S3 to RDS sync for news summaries...");

    try {
        const newsBucketRepo = new NewsBucketS3ParquetRepository();
        const newsRepository = new NewsDrizzleRepository();

        // Calculate rolling window (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        console.log(`Reading summaries from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

        // Read rolling window from year files
        const rollingSummaries = await newsBucketRepo.getSummariesForDateRange(startDate, endDate);

        if (rollingSummaries.length === 0) {
            console.log("No summaries found in rolling window");
            return;
        }

        console.log(`Found ${rollingSummaries.length} summaries in rolling window`);

        // Batch upsert to RDS
        // insertNewsSummary uses onConflictDoNothing, so it won't duplicate (articleUrl is primary key)
        console.log("Upserting to RDS...");
        await newsRepository.insertNewsSummary(rollingSummaries);

        console.log(`✅ Successfully synced ${rollingSummaries.length} summaries to RDS`);
    } catch (error) {
        console.error("❌ Error in S3 to RDS sync:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

