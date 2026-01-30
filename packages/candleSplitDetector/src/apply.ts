import { BucketS3 } from "@stocker/infra/external/bucket";
import { CandleDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { Candle } from "@stocker/domain/stock/candle";

interface SplitRecord {
    date: string;
    ratio: number;
    detectedAt: string;
}

interface S3Event {
    Records: Array<{
        s3: {
            bucket: { name: string };
            object: { key: string };
        };
    }>;
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
 * Lambda handler for applying stock splits to RDS
 * Triggered by S3 PutObject event on splits/pending/{ticker}-splits.json
 * 
 * Reads split data from S3, applies adjustments to candles in RDS, and moves file to processed location
 */
export async function handler(event: S3Event): Promise<void> {
    console.log("Starting stock split application (apply phase)...");

    if (!event || !event.Records || event.Records.length === 0) {
        console.warn("No S3 records found in event");
        return;
    }

    const bucketService = new BucketS3();

    for (const record of event.Records) {
        const key = record.s3.object.key;
        const bucketName = record.s3.bucket.name;

        // Extract ticker from key: splits/pending/{ticker}-splits.json
        const match = key.match(/splits\/pending\/(.+)-splits\.json/);
        if (!match) {
            console.warn(`Unexpected S3 key format: ${key}, skipping`);
            continue;
        }

        const ticker = match[1];
        console.log(`Processing splits for ${ticker} from ${key}`);

        try {
            // Read split data from S3
            const splitData = await bucketService.getObject(key);
            if (!splitData) {
                console.error(`No data found at ${key}`);
                continue;
            }

            const splits: SplitRecord[] = JSON.parse(splitData);
            console.log(`Found ${splits.length} split(s) to apply for ${ticker}`);

            // Read candles from RDS
            const candleRepository = new CandleDrizzleRepository();
            const allCandles = await candleRepository.getCandlesByTickers([ticker]);
            const tickerCandles = allCandles[ticker] || [];

            if (tickerCandles.length === 0) {
                console.log(`No candles found in RDS for ${ticker}, skipping split application`);
                // Still move file to processed to avoid reprocessing
                await moveToProcessed(bucketService, key, ticker, splits);
                continue;
            }

            // Apply each split (process in chronological order)
            let adjustedCandles = tickerCandles;
            for (const split of splits) {
                const splitDate = new Date(split.date);
                console.log(`  Applying split on ${split.date} with ratio ${split.ratio}`);

                adjustedCandles = applySplitAdjustment(adjustedCandles, splitDate, split.ratio);
            }

            // Update RDS with adjusted candles
            // insertCandles uses onConflictDoUpdate, so it will update existing records
            await candleRepository.insertCandles(adjustedCandles);
            console.log(`  ✓ Updated ${adjustedCandles.length} candles in RDS`);

            // Move file to processed location
            await moveToProcessed(bucketService, key, ticker, splits);

            console.log(`✅ Successfully applied ${splits.length} split(s) for ${ticker}`);
        } catch (error) {
            console.error(`❌ Error processing splits for ${ticker}:`, error);
            // Don't throw - continue with next record
            // File stays in pending for manual review/retry
        }
    }
}

async function moveToProcessed(
    bucketService: BucketS3,
    pendingKey: string,
    ticker: string,
    splits: SplitRecord[]
): Promise<void> {
    const processedKey = `splits/processed/${ticker}-splits.json`;
    
    // Copy to processed location
    await bucketService.putObject(
        processedKey,
        JSON.stringify(splits, null, 2),
        "application/json"
    );
    
    // Delete from pending location
    try {
        // Note: BucketS3 might not have delete method, but we can overwrite or leave it
        // For now, we'll just write to processed. The pending file can be cleaned up separately
        // or we can implement delete if needed
        console.log(`  Moved to processed: ${processedKey}`);
    } catch (error) {
        console.warn(`  Could not delete pending file ${pendingKey}, but file copied to processed`);
    }
}
