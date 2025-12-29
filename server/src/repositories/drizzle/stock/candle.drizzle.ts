import CandlesRepository from "../../interfaces/stock/candles.repository";
import { db } from "server/src/infra/db/db";
import { candles } from "server/src/infra/db/schema/candle.schema";
import { inArray, desc } from "drizzle-orm";
import Candle from "server/src/domain/stock/candle";
import { DbCandle } from "server/src/infra/db/schema/candle.schema";

export default class CandleDrizzleRepository implements CandlesRepository {
    async getCandlesByTickers(tickers: string[]): Promise<Record<string, Candle[]>> {
        const dbCandles: DbCandle[] = await db.select().from(candles).where(inArray(candles.ticker, tickers)).orderBy(desc(candles.date));
        return dbCandles.reduce((acc, dbCandle) => {
            acc[dbCandle.ticker] = [...(acc[dbCandle.ticker] || []), this.toDomainCandle(dbCandle)];
            return acc;
        }, {} as Record<string, Candle[]>);
    }

    async insertCandles(candlesToInsert: Candle[]): Promise<void> {
        await db.insert(candles).values(candlesToInsert.map(this.toDbCandle));
    }


    toDomainCandle(db: DbCandle): Candle {
        return {
            ticker: db.ticker,
            open: parseFloat(db.open),
            high: parseFloat(db.high),
            low: parseFloat(db.low),
            close: parseFloat(db.close),
            volume: parseFloat(db.volume),
            date: new Date(db.date),
        };
    }

    toDbCandle(candle: Candle): DbCandle{
        return {
            ticker: candle.ticker,
            open: candle.open.toString(),
            high: candle.high.toString(),
            low: candle.low.toString(),
            close: candle.close.toString(),
            volume: candle.volume.toString(),
            date: new Date(candle.date).toISOString().split("T")[0], //YYYY-MM-DD
        };
    }
}