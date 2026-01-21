import { CandleYfinance } from "@stocker/infra/external/candle";
import { BucketS3 } from "@stocker/infra/external/bucket";
import { CandleDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { Candle } from "@stocker/domain/stock/candle";

interface SplitRecord {
    date: string;
    ratio: number;
    detectedAt: string;
    appliedToDb: boolean;
}

async function getExistingSplits(ticker: string): Promise<SplitRecord[]> {
    const bucketService = new BucketS3();
    const key = `splits/${ticker}-splits.json`;

    try {
        const data = await bucketService.getObject(key);
        if (!data) return [];
        return JSON.parse(data) as SplitRecord[];
    } catch {
        return [];
    }
}

async function saveSplits(ticker: string, splits: SplitRecord[]): Promise<void> {
    const bucketService = new BucketS3();
    const key = `splits/${ticker}-splits.json`;
    await bucketService.putObject(key, JSON.stringify(splits, null, 2), "application/json");
}

function applySplitAdjustment(candles: Candle[], splitDate: Date, splitRatio: number): Candle[] {
    return candles.map(candle => {
        // Only adjust candles before the split date
        if (candle.date < splitDate) {
            return {
                ...candle,
                open: candle.open / splitRatio,
                high: candle.high / splitRatio,
                low: candle.low / splitRatio,
                close: candle.close / splitRatio,
                volume: candle.volume * splitRatio, // Volume increases
            };
        }
        return candle;
    });
}

/**
 * Lambda handler for detecting and applying stock splits
 * Triggered by EventBridge (daily after S3-to-RDS sync)
 * 
 * Fetches recent splits, compares with S3 records, and updates RDS for new splits
 */
export async function handler(): Promise<void> {
    console.log("Starting stock split detection...");

    try {
        const candleService = new CandleYfinance();
        const candleRepository = new CandleDrizzleRepository();
        const stockRepository: StocksRepository = new StocksDrizzleRepository();

        // Get all tickers
        const stocks = await stockRepository.getStocks();
        const tickers = stocks.map(stock => stock.ticker);

        console.log(`Checking splits for ${tickers.length} tickers`);

        // Check last 30 days for splits
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        let totalSplitsApplied = 0;

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

                // For each new split, update database
                for (const newSplit of newSplits) {
                    console.log(`  Processing split on ${newSplit.date.toISOString().split("T")[0]} with ratio ${newSplit.ratio}`);

                    // Read all candles for this ticker from RDS
                    const allCandles = await candleRepository.getCandlesByTickers([ticker]);
                    const tickerCandles = allCandles[ticker] || [];

                    if (tickerCandles.length === 0) {
                        console.log(`    No candles found in RDS for ${ticker}, skipping`);
                        continue;
                    }

                    // Apply split adjustment to candles before split date
                    const adjustedCandles = applySplitAdjustment(
                        tickerCandles,
                        newSplit.date,
                        newSplit.ratio
                    );

                    // Update RDS with adjusted candles
                    // insertCandles uses onConflictDoUpdate, so it will update existing records
                    await candleRepository.insertCandles(adjustedCandles);

                    console.log(`    ✓ Updated ${adjustedCandles.length} candles in RDS`);

                    // Save split record to S3
                    const splitRecord: SplitRecord = {
                        date: newSplit.date.toISOString().split("T")[0],
                        ratio: newSplit.ratio,
                        detectedAt: new Date().toISOString(),
                        appliedToDb: true
                    };

                    existingSplits.push(splitRecord);
                    await saveSplits(ticker, existingSplits);

                    totalSplitsApplied++;
                }
            } catch (error) {
                console.error(`Error processing splits for ${ticker}:`, error);
                // Continue with next ticker
            }
        }

        console.log(`✅ Split detection complete. Applied ${totalSplitsApplied} new split(s)`);
    } catch (error) {
        console.error("❌ Error in split detection:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

