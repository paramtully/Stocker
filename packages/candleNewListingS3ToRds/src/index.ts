import { BucketS3 } from "@stocker/infra/external/bucket";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";

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

interface DetectionLog {
    date: string;
    lastUpdated: string;
    newTickers: Array<{
        ticker: string;
        companyName: string;
        marketCap: string;
        industry: string;
        exchange: string;
        addedAt: string;
    }>;
}

/**
 * Lambda handler for syncing new listings from S3 to RDS
 * Triggered by S3 PutObject event on listings/current-listings.json
 * 
 * Reads current listings from S3, compares with database, and inserts new stocks
 */
export async function handler(): Promise<void> {
    console.log("Starting new listing detection from S3...");

    try {
        const bucketService = new BucketS3();
        const stockRepository: StocksRepository = new StocksDrizzleRepository();

        // Read current listings from S3
        const key = "listings/current-listings.json";
        console.log(`Reading from S3: ${key}`);
        const s3Data = await bucketService.getObject(key);

        if (!s3Data) {
            console.error("No data found in S3");
            return;
        }

        const listings: CurrentListings = JSON.parse(s3Data);
        console.log(`Found ${listings.currentTickers.length} current tickers (last updated: ${listings.lastUpdated})`);

        // Get existing stocks from database
        console.log("Fetching existing stocks from database...");
        const existingStocks = await stockRepository.getStocks();
        const existingTickers = new Set(existingStocks.map(stock => stock.ticker));
        console.log(`Found ${existingTickers.size} existing stocks in database`);

        // Find new tickers
        const newTickers = listings.currentTickers.filter(ticker => !existingTickers.has(ticker));

        if (newTickers.length === 0) {
            console.log("No new listings found");
            return;
        }

        console.log(`Found ${newTickers.length} new ticker(s): ${newTickers.join(", ")}`);

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const newListings: DetectionLog["newTickers"] = [];

        // Fetch metadata and add to database
        for (const ticker of newTickers) {
            try {
                console.log(`Processing new ticker: ${ticker}`);

                // Find stock metadata from the listings data
                const stock = listings.stockMetadata.find(s => s.ticker === ticker);

                if (!stock) {
                    console.warn(`  ⚠ Could not find metadata for ${ticker} in listings data, skipping`);
                    continue;
                }

                // Insert into database
                await stockRepository.insertStock({
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    marketCap: stock.marketCap,
                    industry: stock.industry,
                    exchange: stock.exchange,
                    updatedAt: new Date(),
                });

                console.log(`  ✓ Added ${ticker} to database`);

                newListings.push({
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    marketCap: stock.marketCap,
                    industry: stock.industry,
                    exchange: stock.exchange,
                    addedAt: new Date().toISOString(),
                });

                // TODO: Optionally trigger historical data fetch for new ticker
                // This could queue a job or trigger the historical load process
            } catch (error) {
                console.error(`  ✗ Error processing ${ticker}:`, error);
                // Continue with next ticker
            }
        }

        // Save detection log to S3 (for audit)
        if (newListings.length > 0) {
            const log: DetectionLog = {
                date: dateStr,
                lastUpdated: listings.lastUpdated,
                newTickers: newListings,
            };
            const logKey = `listings/processed/detection-${dateStr}.json`;
            await bucketService.putObject(logKey, JSON.stringify(log, null, 2), "application/json");
            console.log(`✅ Added ${newListings.length} new stock(s) to database and saved detection log`);
        }
    } catch (error) {
        console.error("❌ Error in new listing detection:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

