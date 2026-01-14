import { Candle } from "@stocker/domain/stock/candle";

export default interface CandleBucketRepository {
    saveHistoricalCandles(candles: Candle[]): Promise<void>;
    saveDailyCandles(date: Date, candles: Candle[]): Promise<void>;
    getHistoricalCandles(): Promise<Candle[] | null>;
    getDailyCandles(date: Date): Promise<Candle[] | null>;
}

