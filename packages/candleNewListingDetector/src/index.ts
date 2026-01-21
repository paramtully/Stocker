import { CandleFallbackService } from "@stocker/infra/external/candle";
import StockExternalService from "@stocker/infra/external/stock/stock.external";
import StockYfinance from "@stocker/infra/external/stock/stock.yfinance";
import { BucketS3 } from "@stocker/infra/external/bucket";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { Stock } from "@stocker/domain/stock/stock";

interface NewListingLog {
    date: string;
    newTickers: Array<{
        ticker: string;
        companyName: string;
        marketCap: string;
        industry: string;
        exchange: string;
        addedAt: string;
    }>;
}

async function saveListingLog(log: NewListingLog): Promise<void> {
    const bucketService = new BucketS3();
    const key = `listings/new-listings-${log.date}.json`;
    await bucketService.putObject(key, JSON.stringify(log, null, 2), "application/json");
}

/**
 * Lambda handler for detecting new NASDAQ listings
 * Triggered by EventBridge (daily after S3-to-RDS sync)
 * 
 * Compares current NASDAQ tickers with database and adds new stocks
 */
export async function handler(): Promise<void> {
    console.log("Starting new listing detection...");

    try {
        const candleService = new CandleFallbackService();
        const stockService: StockExternalService = new StockYfinance();
        const stockRepository: StocksRepository = new StocksDrizzleRepository();

        // Fetch currently listed NASDAQ tickers
        console.log("Fetching current NASDAQ tickers...");
        const currentTickers = await candleService.getCurrentlyListedNasdaqTickers();
        console.log(`Found ${currentTickers.length} current NASDAQ tickers`);

        // Get existing tickers from database
        const existingStocks = await stockRepository.getStocks();
        const existingTickers = new Set(existingStocks.map(stock => stock.ticker));

        // Find new tickers
        const newTickers = currentTickers.filter(ticker => !existingTickers.has(ticker));

        if (newTickers.length === 0) {
            console.log("No new listings found");
            return;
        }

        console.log(`Found ${newTickers.length} new ticker(s): ${newTickers.join(", ")}`);

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const newListings: NewListingLog["newTickers"] = [];

        // Fetch metadata and add to database
        for (const ticker of newTickers) {
            try {
                console.log(`Processing new ticker: ${ticker}`);

                // Fetch stock metadata
                const stocks = await stockService.getAllStocks("NASDAQ");
                const stock = stocks.find(s => s.ticker === ticker);

                if (!stock) {
                    console.warn(`  ⚠ Could not fetch metadata for ${ticker}, skipping`);
                    continue;
                }

                // Insert into database
                await stockRepository.insertStock({
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    marketCap: stock.marketCap.toString(),
                    industry: stock.industry,
                    exchange: stock.exchange,
                    updatedAt: new Date(),
                });

                console.log(`  ✓ Added ${ticker} to database`);

                newListings.push({
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    marketCap: stock.marketCap.toString(),
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

        // Save detection log to S3
        if (newListings.length > 0) {
            const log: NewListingLog = {
                date: dateStr,
                newTickers: newListings,
            };
            await saveListingLog(log);
            console.log(`✅ Added ${newListings.length} new stock(s) to database`);
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

