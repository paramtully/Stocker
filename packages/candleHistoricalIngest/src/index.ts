import { CandleBucketS3ParquetRepository } from "@stocker/bucketRepository";
import { CandleDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { BucketS3 } from "@stocker/infra/external/bucket";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { Context } from "aws-lambda";

interface Checkpoint {
    lastProcessedYear?: number;
    totalYears: number;
    processedYears: number;
    startedAt: string;
    lastUpdated: string;
}

interface LambdaEvent {
    lastProcessedYear?: number;
    startYear?: number;
}

const BATCH_SIZE = 10000; // Process candles in batches of 10K
const TIME_BUFFER_MS = 30000; // 30 seconds buffer for checkpoint and next invocation
const LAMBDA_TIMEOUT_MS = 900000; // 15 minutes in milliseconds

async function saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const bucketService = new BucketS3();
    const key = `checkpoints/candle-bulk-load-checkpoint.json`;
    await bucketService.putObject(key, JSON.stringify(checkpoint, null, 2), "application/json");
}

async function loadCheckpoint(): Promise<Checkpoint | null> {
    const bucketService = new BucketS3();
    const key = `checkpoints/candle-bulk-load-checkpoint.json`;
    try {
        const data = await bucketService.getObject(key);
        if (!data) return null;
        return JSON.parse(data) as Checkpoint;
    } catch {
        return null;
    }
}

async function getYearFiles(): Promise<number[]> {
    const candleBucketRepo = new CandleBucketS3ParquetRepository();
    const bucketService = new BucketS3();
    
    // List all year parquet files
    const keys = await bucketService.listObjects("candles/year/");
    const parquetKeys = keys.filter(key => key.endsWith('.parquet'));
    
    // Extract years from filenames (format: candles/year/YYYY.parquet)
    const years = parquetKeys
        .map(key => {
            const match = key.match(/(\d{4})\.parquet$/);
            return match ? parseInt(match[1], 10) : null;
        })
        .filter((year): year is number => year !== null)
        .sort((a, b) => a - b);
    
    return years;
}

async function processYearFile(year: number, candleBucketRepo: CandleBucketS3ParquetRepository, candleRepository: CandleDrizzleRepository): Promise<number> {
    console.log(`Processing year ${year}...`);
    
    try {
        // Use getCandlesForDateRange to read the entire year
        // This method already handles reading the year parquet file efficiently
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        const candles = await candleBucketRepo.getCandlesForDateRange(startDate, endDate);
        
        if (candles.length === 0) {
            console.log(`No candles found for year ${year}`);
            return 0;
        }
        
        console.log(`Found ${candles.length} candles for year ${year}`);
        
        // Process in batches
        let totalProcessed = 0;
        for (let i = 0; i < candles.length; i += BATCH_SIZE) {
            const batch = candles.slice(i, i + BATCH_SIZE);
            await candleRepository.insertCandles(batch);
            totalProcessed += batch.length;
            console.log(`  Processed batch: ${totalProcessed}/${candles.length} candles for year ${year}`);
        }
        
        console.log(`✅ Completed year ${year}: ${totalProcessed} candles`);
        return totalProcessed;
    } catch (error) {
        console.error(`❌ Error processing year ${year}:`, error);
        throw error;
    }
}

async function invokeNextLambda(functionName: string, nextYear: number, region: string): Promise<void> {
    const lambdaClient = new LambdaClient({ region });
    
    const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "Event", // Async invocation
        Payload: JSON.stringify({
            lastProcessedYear: nextYear - 1,
            startYear: nextYear
        })
    });
    
    await lambdaClient.send(command);
    console.log(`Invoked next Lambda for year ${nextYear}`);
}

function getRemainingTimeMs(context: Context | null): number {
    if (!context) {
        // Local testing - return a large value
        return LAMBDA_TIMEOUT_MS;
    }
    return context.getRemainingTimeInMillis();
}

/**
 * Lambda handler for bulk loading all historical candle data from S3 to RDS
 * Processes year files one at a time, with checkpointing and recursive invocation
 */
export async function handler(event: LambdaEvent = {}, context: Context | null = null): Promise<void> {
    console.log("Starting historical candle bulk load to RDS...");
    
    try {
        const candleBucketRepo = new CandleBucketS3ParquetRepository();
        const candleRepository = new CandleDrizzleRepository();
        
        // Get all year files
        const allYears = await getYearFiles();
        
        if (allYears.length === 0) {
            console.log("No year files found in S3");
            return;
        }
        
        console.log(`Found ${allYears.length} year files: ${allYears.join(", ")}`);
        
        // Determine starting point
        let startIndex = 0;
        let checkpoint: Checkpoint | null = null;
        
        if (event.startYear) {
            // Resume from specific year
            startIndex = allYears.findIndex(y => y >= event.startYear!);
            if (startIndex === -1) {
                console.log(`Year ${event.startYear} not found, starting from beginning`);
                startIndex = 0;
            }
        } else {
            // Check for existing checkpoint
            checkpoint = await loadCheckpoint();
            if (checkpoint && checkpoint.lastProcessedYear) {
                startIndex = allYears.findIndex(y => y > checkpoint!.lastProcessedYear!);
                if (startIndex === -1) {
                    console.log("All years already processed according to checkpoint");
                    return;
                }
                console.log(`Resuming from checkpoint: year ${checkpoint.lastProcessedYear}, continuing from year ${allYears[startIndex]}`);
            } else {
                // Start fresh
                checkpoint = {
                    totalYears: allYears.length,
                    processedYears: 0,
                    startedAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
            }
        }
        
        // Process years one at a time
        for (let i = startIndex; i < allYears.length; i++) {
            const year = allYears[i];
            const remainingTime = getRemainingTimeMs(context);
            
            // Check if we have enough time to process this year
            // Leave buffer for checkpoint save and next invocation
            if (remainingTime < TIME_BUFFER_MS * 2) {
                console.log(`Low on time (${remainingTime}ms remaining), saving checkpoint and invoking next Lambda...`);
                
                // Update checkpoint
                if (!checkpoint) {
                    checkpoint = {
                        totalYears: allYears.length,
                        processedYears: i,
                        startedAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                } else {
                    checkpoint.lastProcessedYear = year;
                    checkpoint.processedYears = i;
                    checkpoint.lastUpdated = new Date().toISOString();
                }
                
                await saveCheckpoint(checkpoint);
                
                // Invoke next Lambda
                const functionName = process.env.LAMBDA_FUNCTION_NAME;
                const region = process.env.AWS_REGION || "us-east-1";
                
                if (functionName) {
                    await invokeNextLambda(functionName, year, region);
                } else {
                    console.warn("LAMBDA_FUNCTION_NAME not set, cannot invoke next Lambda");
                }
                
                return;
            }
            
            // Process this year
            const processed = await processYearFile(year, candleBucketRepo, candleRepository);
            
            // Update checkpoint
            if (!checkpoint) {
                checkpoint = {
                    totalYears: allYears.length,
                    processedYears: i + 1,
                    startedAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
            } else {
                checkpoint.lastProcessedYear = year;
                checkpoint.processedYears = i + 1;
                checkpoint.lastUpdated = new Date().toISOString();
            }
            
            // Save checkpoint every year
            await saveCheckpoint(checkpoint);
        }
        
        // All years processed
        console.log(`✅ Successfully bulk loaded all historical candles to RDS!`);
        console.log(`   Total years processed: ${allYears.length}`);
        
        // Clear checkpoint on completion
        const bucketService = new BucketS3();
        await bucketService.deleteObject("checkpoints/candle-bulk-load-checkpoint.json");
        
    } catch (error) {
        console.error("❌ Error in historical candle bulk load:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler({}, null).catch(console.error);
}
