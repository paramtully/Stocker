import { CandleBucketRepository, CandleBucketS3Repository } from "@stocker/bucketRepository";
import { CandleExternalService, CandleYfinance } from "@stocker/infra/external/candle";
import { Candle } from "@stocker/domain/stock/candle";

export async function fetchHistoricalCandles(tickers: string[]): Promise<void> {
    console.log(`Fetching historical candles for ${tickers.length} tickers...`);
    
    const candleService: CandleExternalService = new CandleYfinance();
    const candleBucketRepo: CandleBucketRepository = new CandleBucketS3Repository();

    let candles: Record<string, Candle[]> = {};

    // get all historical candles
    try {
        candles = await candleService.getHistoricalCandles(tickers);
        if (!candles) {
            throw new Error(`No candles found`);
        }
    } catch (error) {
        console.error(`Error fetching historical candles:`, error);
        return;
    }

    // save all historical candles to bucket
    try {
        await candleBucketRepo.saveHistoricalCandles(candles);
    } catch (error) {
        console.error(`Error saving historical candles to S3:`, error);
        return;
    }
    
    console.log(`\nHistorical candle population complete!`);
}

