import { CandleExternalService, CandleFallbackService } from "@stocker/infra/external/candle";
import { CandleBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { BucketS3 } from "@stocker/infra/external/bucket";
import { CandleBucketRepository } from "@stocker/bucketRepository";

interface Checkpoint {
    lastProcessedTicker?: string;
    lastProcessedYear?: number;
    startedAt: string;
    lastUpdated: string;
    totalTickers: number;
    processedTickers: number;
}

async function saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const bucketService = new BucketS3();
    const key = `checkpoints/historical-load-checkpoint.json`;
    await bucketService.putObject(key, JSON.stringify(checkpoint, null, 2), "application/json");
}

async function loadCheckpoint(): Promise<Checkpoint | null> {
    const bucketService = new BucketS3();
    const key = `checkpoints/historical-load-checkpoint.json`;
    try {
        const data = await bucketService.getObject(key);
        if (!data) return null;
        return JSON.parse(data) as Checkpoint;
    } catch {
        return null;
    }
}

async function saveErrorLog(errorLog: any[]): Promise<void> {
    if (errorLog.length === 0) return;

    const bucketService = new BucketS3();
    const key = `errors/candles/provider-errors-${Date.now()}.json`;
    await bucketService.putObject(key, JSON.stringify(errorLog, null, 2), "application/json");
}

async function main() {
    console.log("Starting historical candle data load...");

    try {

        // Initialize services
        const candleService: CandleFallbackService = new CandleFallbackService();
        const candleBucketRepo: CandleBucketRepository = new CandleBucketS3ParquetRepository();


        // Get all stocks
        const tickers = await candleService.getCurrentlyListedNasdaqTickers();

        if (tickers.length === 0) {
            console.log("No tickers found");
            process.exit(1);
        }

        // Load checkpoint if exists
        let checkpoint = await loadCheckpoint();
        const startIndex = checkpoint ? tickers.findIndex(t => t === checkpoint!.lastProcessedTicker) + 1 : 0;

        if (checkpoint) {
            console.log(`Resuming from checkpoint: ${checkpoint.lastProcessedTicker} (${startIndex}/${tickers.length})`);
        } else {
            checkpoint = {
                startedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalTickers: tickers.length,
                processedTickers: 0,
            };
        }

        // Process tickers
        for (let i = startIndex; i < tickers.length; i++) {
            const ticker = tickers[i];
            console.log(`\n[${i + 1}/${tickers.length}] Processing ${ticker}...`);

            try {
                // Fetch historical candles with fallback
                const candles = await candleService.getHistoricalCandles([ticker]);

                if (candles[ticker] && candles[ticker].length > 0) {
                    // Save to S3 (year-based files)
                    const allCandles = candles[ticker];
                    await candleBucketRepo.saveHistoricalCandles(allCandles);
                    console.log(`  ✓ Saved ${allCandles.length} candles for ${ticker}`);
                } else {
                    console.warn(`  ⚠ No candles found for ${ticker}`);
                }

                // Update checkpoint
                checkpoint.lastProcessedTicker = ticker;
                checkpoint.processedTickers = i + 1;
                checkpoint.lastUpdated = new Date().toISOString();

                // Save checkpoint every 10 tickers
                if ((i + 1) % 10 === 0) {
                    await saveCheckpoint(checkpoint);
                    console.log(`  ✓ Checkpoint saved`);
                }

            } catch (error) {
                console.error(`  ✗ Error processing ${ticker}:`, error);
                // Continue with next ticker
            }
        }

        // Save final checkpoint
        checkpoint.processedTickers = tickers.length;
        checkpoint.lastUpdated = new Date().toISOString();
        await saveCheckpoint(checkpoint);

        // Save error log
        const errorLog = candleService.getErrorLog();
        if (errorLog.length > 0) {
            await saveErrorLog(errorLog);
            console.log(`\n⚠ Saved ${errorLog.length} provider errors to S3`);
        }

        console.log("\n✅ Historical candle data load complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in historical load:", error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

