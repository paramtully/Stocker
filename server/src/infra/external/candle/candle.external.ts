import Candle from "server/src/domain/stock/candle";

export default interface CandleExternalService {
    getHistoricalCandles(tickers: string[]): Promise<Candle[]>;
    getDailyCandles(tickers: string[]): Promise<Candle[]>;
    getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Candle[]>;
}