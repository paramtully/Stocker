import { Candle } from "packages/domain/stock";

export default interface CandleExternalService {
    getCurrentlyListedNasdaqTickers(): Promise<string[]>;
    getHistoricalCandles(tickers: string[]): Promise<Candle[]>;
    getDailyCandles(tickers: string[]): Promise<Candle[]>;
    getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Candle[]>;
}