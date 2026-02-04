import { DbStock } from "../../../../db/src/schema/stocks.schema";
import StocksRepository from "../../interfaces/stock/stocks.repository";
import { Stock } from "packages/domain/src/stock";
import { db } from "../../../../db/src/db";
import { stocks } from "../../../../db/src/schema/stocks.schema";
import { eq, like } from "drizzle-orm";

export default class StocksDrizzleRepository implements StocksRepository {
    async getStockByTicker(ticker: string): Promise<Stock | null> {
        const [dbStock] = await db.select().from(stocks).where(eq(stocks.ticker, ticker));
        return dbStock ? this.toDomainStock(dbStock as DbStock) : null;
    }

    async getStocks(): Promise<Stock[]> {
        const dbStocks: DbStock[] = await db.select().from(stocks);
        return dbStocks.map(this.toDomainStock);
    }

    async getStocksByPrefix(prefix: string, limit: number = 10): Promise<Stock[]> {
        const dbStocks: DbStock[] = await db.select().from(stocks).where(like(stocks.ticker, `${prefix}%`)).limit(limit);
        return dbStocks.map(this.toDomainStock);
    }

    async insertStock(stock: DbStock): Promise<Stock> {
        const [dbStock] = await db
        .insert(stocks)
        .values(stock)
        .onConflictDoUpdate({
            target: [stocks.ticker],
            set: {
                companyName: stock.companyName,
                marketCap: stock.marketCap,
                industry: stock.industry,
                exchange: stock.exchange,
                updatedAt: new Date(),
            },
        }).returning();
        return this.toDomainStock(dbStock as DbStock);
    }

    async deleteStock(ticker: string): Promise<void> {
        await db.delete(stocks).where(eq(stocks.ticker, ticker));
    }

    async updateStock(stock: DbStock): Promise<Stock> {
        const [dbStock] = await db.update(stocks).set(stock).where(eq(stocks.ticker, stock.ticker)).returning();
        return this.toDomainStock(dbStock as DbStock);
    }

    toDomainStock(db: DbStock): Stock {
        return {
            ticker: db.ticker,
            companyName: db.companyName,
            // cik: db.cik,
            // isin: db.isin,
            // cusip: db.cusip,
            marketCap: parseFloat(db.marketCap),
            industry: db.industry,
            exchange: db.exchange,
        };
    }

}