import { CandleFallbackService } from "@stocker/infra/external/candle";
import StockExternalService from "@stocker/infra/external/stock/stock.external";
import StockYfinance from "@stocker/infra/external/stock/stock.yfinance";
import { BucketS3 } from "@stocker/infra/external/bucket";

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
 * Lambda handler for fetching current NASDAQ listings
 * Triggered by EventBridge (every 3 days)
 * 
 * Fetches current NASDAQ tickers and stock metadata, writes to S3
 * (single file that gets overwritten each run)
 */
export async function handler(): Promise<void> {
    console.log("Starting NASDAQ listing ingestion...");

    try {
        const candleService = new CandleFallbackService();
        const stockService: StockExternalService = new StockYfinance();
        const bucketService = new BucketS3();

        // Fetch currently listed NASDAQ tickers
        console.log("Fetching current NASDAQ tickers...");
        const currentTickers = await candleService.getCurrentlyListedNasdaqTickers();
        console.log(`Found ${currentTickers.length} current NASDAQ tickers`);

        // Fetch stock metadata for all NASDAQ stocks
        console.log("Fetching stock metadata for all NASDAQ stocks...");
        const allStocks = await stockService.getAllStocks("NASDAQ");
        console.log(`Found ${allStocks.length} stock records`);

        // Filter to only include stocks that are in the current tickers list
        const stockMetadata = allStocks
            .filter(stock => currentTickers.includes(stock.ticker))
            .map(stock => ({
                ticker: stock.ticker,
                companyName: stock.companyName,
                marketCap: stock.marketCap.toString(),
                industry: stock.industry,
                exchange: stock.exchange,
            }));

        // Create the listings data structure
        const listings: CurrentListings = {
            lastUpdated: new Date().toISOString(),
            currentTickers: currentTickers,
            stockMetadata: stockMetadata,
        };

        // Write to S3 (overwrites existing file)
        const key = "listings/current-listings.json";
        console.log(`Writing to S3: ${key}`);
        await bucketService.putObject(
            key,
            JSON.stringify(listings, null, 2),
            "application/json"
        );

        console.log(`✅ Successfully wrote ${stockMetadata.length} stock records to S3`);
    } catch (error) {
        console.error("❌ Error in listing ingestion:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

