import { ChartPeriod } from "server/src/domain/chartPeriod";
import Candle from "server/src/domain/stock/candle";
import { DbCandle } from "server/src/infra/db/schema/candle.schema";

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