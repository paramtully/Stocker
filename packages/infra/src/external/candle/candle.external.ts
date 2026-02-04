import { Candle } from "packages/domain/stock";

export default interface CandleExternalService {
    getCurrentlyListedNasdaqTickers(): Promise<string[]>;
    getHistoricalCandles(tickers: string[]): Promise<Record<string, Candle[]>>;
    getDailyCandles(tickers: string[]): Promise<Record<string, Candle[]>>;
    getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Record<string, Candle[]>>;
    getStockSplits(ticker: string, startDate: string, endDate: string): Promise<Array<{ date: Date; ratio: number }>>
}