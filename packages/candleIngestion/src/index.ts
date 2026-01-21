import { CandleFallbackService } from "@stocker/infra/external/candle";
import { CandleBucketS3ParquetRepository, ErrorManifest } from "@stocker/bucketRepository";
import { MarketCalendar } from "@stocker/infra/utils";
import StocksRepository from "@stocker/repositories/interfaces/stock/stocks.repository";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { Candle } from "@stocker/domain/stock/candle";

/**
 * Lambda handler for daily candle ingestion
 * Triggered by EventBridge (daily at 8am EST, only on trading days)
 */
export async function handler(): Promise<void> {
    console.log("Starting daily candle ingestion...");

    try {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Check if today is a trading day
        if (!MarketCalendar.isTradingDay(today)) {
            console.log("Today is not a trading day, skipping candle ingestion");
            return;
        }

        // Get all tickers from database
        const stockRepository: StocksRepository = new StocksDrizzleRepository();
        const stocks = await stockRepository.getStocks();
        const tickers = stocks.map(stock => stock.ticker);

        if (tickers.length === 0) {
            console.log("No tickers found in database");
            return;
        }

        console.log(`Processing ${tickers.length} tickers for ${today.toISOString().split("T")[0]}`);

        // Initialize services
        const candleService = new CandleFallbackService();
        const candleBucketRepo = new CandleBucketS3ParquetRepository();

        // Create error manifest
        const dateStr = today.toISOString().split("T")[0];
        const errorManifest: ErrorManifest = {
            date: dateStr,
            dataType: 'candles',
            errors: [],
            partialSuccess: []
        };

        // Fetch today's candles
        console.log("Fetching today's candles...");
        const todayCandles = await candleService.getDailyCandles(tickers);
        const allTodayCandles: Candle[] = [];

        // Process results
        for (const [ticker, candles] of Object.entries(todayCandles)) {
            if (candles && candles.length > 0) {
                allTodayCandles.push(...candles);
                errorManifest.partialSuccess.push({
                    ticker,
                    date: dateStr,
                    recordCount: candles.length
                });
            } else {
                errorManifest.errors.push({
                    ticker,
                    date: dateStr,
                    error: "No data returned from API",
                    retryCount: 0,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Save today's data to current year file (read, merge, write)
        if (allTodayCandles.length > 0) {
            console.log(`Saving ${allTodayCandles.length} candles to year file ${currentYear}...`);
            await candleBucketRepo.updateYearFileWithDailyData(currentYear, allTodayCandles);
            console.log(`✓ Saved to year file`);
        }

        // Check for missing trading days in rolling window (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        console.log("Checking for missing trading days in rolling window...");
        const { missingDates, missingByTicker } = await candleBucketRepo.getMissingTradingDays(
            startDate,
            endDate,
            tickers
        );

        if (missingDates.length > 0) {
            console.log(`Found ${missingDates.length} missing trading days, retrying...`);

            // Retry missing dates
            for (const missingDate of missingDates) {
                const missingYear = missingDate.getFullYear();
                const dateStrMissing = missingDate.toISOString().split("T")[0];
                console.log(`Retrying ${dateStrMissing}...`);

                try {
                    const missingCandles = await candleService.getRangeCandles(
                        tickers,
                        missingDate,
                        missingDate
                    );

                    const allMissing: Candle[] = [];
                    for (const [ticker, candles] of Object.entries(missingCandles)) {
                        if (candles && candles.length > 0) {
                            allMissing.push(...candles);
                        }
                    }

                    if (allMissing.length > 0) {
                        await candleBucketRepo.updateYearFileWithDailyData(missingYear, allMissing);
                        console.log(`  ✓ Saved ${allMissing.length} candles for ${dateStrMissing}`);
                    }
                } catch (error) {
                    console.error(`  ✗ Error retrying ${dateStrMissing}:`, error);
                }
            }
        } else {
            console.log("✓ No missing trading days found");
        }

        // Save error manifest
        await candleBucketRepo.saveErrorManifest(errorManifest);

        // Log provider errors if any
        const errorLog = candleService.getErrorLog();
        if (errorLog.length > 0) {
            console.warn(`⚠ ${errorLog.length} provider errors encountered`);
        }

        console.log("✅ Daily candle ingestion complete!");
    } catch (error) {
        console.error("❌ Error in daily ingestion:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

