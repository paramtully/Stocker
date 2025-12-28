import Candle from "server/src/domain/stock/candle";
import { DbCandle } from "server/src/infra/db/schema/candle.schema";

export default interface CandlesRepository {
    getCandlesByTicker(ticker: string): Promise<Candle[]>;
    insertCandles(candlesToInsert: Candle[]): Promise<void>;
    toDomainCandle(db: DbCandle): Candle;
    toDbCandle(candle: Candle): DbCandle;
}