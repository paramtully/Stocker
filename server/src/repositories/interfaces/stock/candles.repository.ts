import Candle from "server/src/domain/stock/candle";
import { DbCandle } from "server/src/infra/db/schema/candle.schema";

export default interface CandlesRepository {
    getCandlesByTickers(tickers: string[]): Promise<Record<string, Candle[]>>;  // candles return in chronological order (newest to oldest)
    insertCandles(candlesToInsert: Candle[]): Promise<void>;
    toDomainCandle(db: DbCandle): Candle;
    toDbCandle(candle: Candle): DbCandle;
}