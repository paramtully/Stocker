import CandlesRepository from "../../interfaces/stock/candles.repository";
import { db } from "../../../../db/src/db";
import { candles } from "../../../../db/src/schema/candle.schema";
import { inArray, desc, and, eq, sql } from "drizzle-orm";
import { Candle } from "packages/domain/src/stock";
import { ChartPeriod } from "packages/domain/src/chartPeriod";
import { DbCandle } from "../../../../db/src/schema/candle.schema";

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

    async getCandleByTickerAndDate(ticker: string, date: Date): Promise<Candle | null> {
        const [dbCandle] = await db.select().from(candles).where(and(eq(candles.ticker, ticker), eq(candles.date, date.toISOString().split("T")[0]))).limit(1);
        return dbCandle ? this.toDomainCandle(dbCandle) : null;
    }

    async getLatestCandlesByTickers(tickers: string[]): Promise<Record<string, Candle | null>> {
        const dbCandles: DbCandle[] = await db.select().from(candles).where(inArray(candles.ticker, tickers)).orderBy(desc(candles.date)).limit(1);
        return dbCandles.reduce((acc, dbCandle) => {
            acc[dbCandle.ticker] = dbCandle ? this.toDomainCandle(dbCandle) : null;
            return acc;
        }, {} as Record<string, Candle | null>);
    }

    async get2LatestCandlesByTickers(tickers: string[]): Promise<Record<string, Candle[]>> {
        const dbCandles: DbCandle[] = await db.select().from(candles).where(inArray(candles.ticker, tickers)).orderBy(desc(candles.date)).limit(2);
        return dbCandles.reduce((acc, dbCandle) => {
            acc[dbCandle.ticker] = [...(acc[dbCandle.ticker] || []), this.toDomainCandle(dbCandle)];
            return acc;
        }, {} as Record<string, Candle[]>);
    }

    async getCandlesByTickersAndPeriod(tickers: string[], period: ChartPeriod): Promise<Record<string, Candle[]>> {
        // Calculate start date based on period
        const startDate = this.getStartDate(period);
        const startDateStr = startDate.toISOString().split("T")[0];

        // Determine SQL interval based on resolution
        const resolution = this.getResolution(period);
        let intervalType: string;
        if (resolution === "daily") {
            intervalType = "day";
        } else if (resolution === "weekly") {
            intervalType = "week";
        } else {
            intervalType = "month";
        }

        // Use SQL to get one candle per interval (most recent one)
        const result = await db.execute(sql`
            SELECT DISTINCT ON (ticker, date_trunc(${sql.raw(`'${intervalType}'`)}, date))
                ticker,
                open,
                high,
                low,
                close,
                volume,
                date
            FROM candles
            WHERE ticker = ANY(${tickers})
                AND date >= ${startDateStr}::date
            ORDER BY ticker, date_trunc(${sql.raw(`'${intervalType}'`)}, date), date DESC
        `);

        // Group by ticker and convert to domain candles
        const candlesByTicker: Record<string, Candle[]> = {};
        for (const row of result.rows) {
            const candle = this.toDomainCandle(row as DbCandle);
            if (!candlesByTicker[candle.ticker]) {
                candlesByTicker[candle.ticker] = [];
            }
            candlesByTicker[candle.ticker].push(candle);
        }

        return candlesByTicker;
    }

    private getResolution(period: ChartPeriod): "daily" | "weekly" | "monthly" {
        if (period === "5Y") return "weekly";
        if (period === "ALL") return "monthly";
        return "daily"; // 1D, 1W, 1M, 1Y
    }

    private getStartDate(period: ChartPeriod): Date {
        const startDate = new Date();
        switch (period) {
            case "1D":
                startDate.setDate(startDate.getDate() - 1);
                break;
            case "1W":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "1M":
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case "1Y":
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case "5Y":
                startDate.setFullYear(startDate.getFullYear() - 5);
                break;
            case "ALL":
                startDate.setFullYear(1970, 0, 1);
                break;
        }
        startDate.setHours(0, 0, 0, 0);
        return startDate;
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