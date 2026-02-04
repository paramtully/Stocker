import { CandleFallbackService } from "@stocker/infra/external/candle";
import { CandleBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { BucketS3 } from "@stocker/infra/external/bucket";
import { Candle } from "@stocker/domain/stock/candle";

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
 * Lambda handler for fetching daily candle data (rolling 7-day window)
 * Triggered by EventBridge (daily after market close, e.g., 6pm EST)
 * 
 * Fetches last 7 days of candles for all currently listed tickers and updates
 * the same year-based parquet files used by historical packages.
 */
export async function handler(): Promise<void> {
    console.log("Starting daily candle data fetch...");

    try {
        const candleService = new CandleFallbackService();
        const candleBucketRepo = new CandleBucketS3ParquetRepository();
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
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // End of today
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0); // Start of day 7 days ago

        console.log(`Fetching candles from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

        // Fetch candles for all tickers in the date range
        const candlesRecord = await candleService.getRangeCandles(tickers, startDate, endDate);
        
        // Flatten all candles into a single array
        const allCandles: Candle[] = [];
        for (const ticker of tickers) {
            const tickerCandles = candlesRecord[ticker] || [];
            allCandles.push(...tickerCandles);
            if (tickerCandles.length > 0) {
                console.log(`  Fetched ${tickerCandles.length} candles for ${ticker}`);
            }
        }

        if (allCandles.length === 0) {
            console.log("No candles found in date range");
            return;
        }

        console.log(`Total candles fetched: ${allCandles.length}`);

        // Group candles by year
        const candlesByYear = new Map<number, Candle[]>();
        for (const candle of allCandles) {
            if (!candle.date || isNaN(candle.date.getTime())) {
                console.warn(`Invalid date in candle for ticker ${candle.ticker}, skipping`);
                continue;
            }
            const year = candle.date.getFullYear();
            if (!candlesByYear.has(year)) {
                candlesByYear.set(year, []);
            }
            candlesByYear.get(year)!.push(candle);
        }

        // Update year files
        console.log(`Updating ${candlesByYear.size} year file(s)...`);
        for (const [year, yearCandles] of candlesByYear) {
            try {
                console.log(`  Updating year ${year} with ${yearCandles.length} candles...`);
                await candleBucketRepo.updateYearFileWithDailyData(year, yearCandles);
                console.log(`  ✓ Successfully updated year ${year}`);
            } catch (error) {
                console.error(`  ✗ Error updating year ${year}:`, error);
                throw error;
            }
        }

        console.log(`✅ Successfully updated ${allCandles.length} candles across ${candlesByYear.size} year file(s)`);
    } catch (error) {
        console.error("❌ Error in daily candle fetch:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}
