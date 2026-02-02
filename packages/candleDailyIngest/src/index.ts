import { CandleBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { CandleDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { Candle } from "@stocker/domain/stock/candle";

/**
 * Lambda handler for syncing candle data from S3 to RDS
 * Triggered by S3 PutObject event on candles/year/*.parquet OR EventBridge (daily after ingestion)
 * 
 * Reads rolling window (last 7 days) from S3 and batch upserts to RDS
 */
export async function handler(): Promise<void> {
    console.log("Starting S3 to RDS sync...");

    try {
        const candleBucketRepo = new CandleBucketS3ParquetRepository();
        const candleRepository = new CandleDrizzleRepository();

        // Calculate rolling window (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        console.log(`Reading candles from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

        // Read rolling window from year files
        const rollingCandles = await candleBucketRepo.getCandlesForDateRange(startDate, endDate);

        if (rollingCandles.length === 0) {
            console.log("No candles found in rolling window");
            return;
        }

        console.log(`Found ${rollingCandles.length} candles in rolling window`);

        // Batch upsert to RDS
        // insertCandles uses onConflictDoUpdate, so it will update existing records
        console.log("Upserting to RDS...");
        await candleRepository.insertCandles(rollingCandles);

        console.log(`✅ Successfully synced ${rollingCandles.length} candles to RDS`);
    } catch (error) {
        console.error("❌ Error in S3 to RDS sync:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

