import { CandleYfinance } from "@stocker/infra/external/candle";
import { BucketS3 } from "@stocker/infra/external/bucket";

interface SplitRecord {
    date: string;
    ratio: number;
    detectedAt: string;
}

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

async function getExistingSplits(ticker: string): Promise<SplitRecord[]> {
    const bucketService = new BucketS3();
    // Check both processed and pending locations
    const processedKey = `splits/processed/${ticker}-splits.json`;
    const pendingKey = `splits/pending/${ticker}-splits.json`;

    try {
        // Try processed first (final state)
        let data = await bucketService.getObject(processedKey);
        if (!data) {
            // Try pending (might be in process)
            data = await bucketService.getObject(pendingKey);
        }
        if (!data) return [];
        return JSON.parse(data) as SplitRecord[];
    } catch {
        return [];
    }
}

/**
 * Lambda handler for fetching stock splits from external API
 * Triggered by EventBridge (daily schedule)
 * 
 * Fetches recent splits from Yahoo Finance API, compares with existing splits in S3,
 * and writes new splits to S3 at splits/pending/{ticker}-splits.json for processing
 */
export async function handler(): Promise<void> {
    console.log("Starting stock split detection (fetch phase)...");

    try {
        const candleService = new CandleYfinance();
        const bucketService = new BucketS3();

        // Get tickers from S3 (from current listings)
        const listingsKey = "listings/current-listings.json";
        console.log(`Reading tickers from S3: ${listingsKey}`);
        const listingsData = await bucketService.getObject(listingsKey);

        if (!listingsData) {
            console.error("No listings data found in S3. Cannot proceed.");
            return;
        }

        const listings: CurrentListings = JSON.parse(listingsData);
        const tickers = listings.currentTickers;
        console.log(`Checking splits for ${tickers.length} tickers`);

        // Check last 30 days for splits
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        let totalNewSplits = 0;

        for (const ticker of tickers) {
            try {
                // Fetch recent splits from API
                const recentSplits = await candleService.getStockSplits(ticker, startDateStr, endDateStr);

                if (recentSplits.length === 0) {
                    continue;
                }

                // Get existing splits from S3
                const existingSplits = await getExistingSplits(ticker);
                const existingSplitDates = new Set(existingSplits.map(s => s.date));

                // Find new splits
                const newSplits = recentSplits.filter(split => {
                    const splitDateStr = split.date.toISOString().split("T")[0];
                    return !existingSplitDates.has(splitDateStr);
                });

                if (newSplits.length === 0) {
                    continue;
                }

                console.log(`Found ${newSplits.length} new split(s) for ${ticker}`);

                // Convert to SplitRecord format and write to pending location
                const splitRecords: SplitRecord[] = newSplits.map(split => ({
                    date: split.date.toISOString().split("T")[0],
                    ratio: split.ratio,
                    detectedAt: new Date().toISOString(),
                }));

                // Write to pending location (will trigger apply Lambda)
                const pendingKey = `splits/pending/${ticker}-splits.json`;
                console.log(`Writing new splits to S3: ${pendingKey}`);
                await bucketService.putObject(
                    pendingKey,
                    JSON.stringify(splitRecords, null, 2),
                    "application/json"
                );

                totalNewSplits += newSplits.length;
            } catch (error) {
                console.error(`Error processing splits for ${ticker}:`, error);
                // Continue with next ticker
            }
        }

        console.log(`✅ Split detection (fetch) complete. Found ${totalNewSplits} new split(s) to process`);
    } catch (error) {
        console.error("❌ Error in split detection (fetch):", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

