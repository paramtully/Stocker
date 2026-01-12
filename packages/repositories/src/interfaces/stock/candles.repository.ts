import { ChartPeriod } from "packages/domain/src/chartPeriod";
import { Candle } from "packages/domain/src/stock";
import { DbCandle } from "../../../../db/src/schema/candle.schema";

export default interface CandlesRepository {
    getCandlesByTickers(tickers: string[]): Promise<Record<string, Candle[]>>;  // candles return in chronological order (newest to oldest)
    insertCandles(candlesToInsert: Candle[]): Promise<void>;
    getCandleByTickerAndDate(ticker: string, date: Date): Promise<Candle | null>;
    getLatestCandlesByTickers(tickers: string[]): Promise<Record<string, Candle | null>>;
    get2LatestCandlesByTickers(tickers: string[]): Promise<Record<string, Candle[]>>;
    getCandlesByTickersAndPeriod(tickers: string[], period: ChartPeriod): Promise<Record<string, Candle[]>>;
    toDomainCandle(db: DbCandle): Candle;
    toDbCandle(candle: Candle): DbCandle;
}