import { DbStock } from "server/src/infra/db/schema/stocks.schema";
import StockRepository from "../interfaces/stock.repository";
import { Stock } from "server/src/domain/stock";
import { db } from "server/src/infra/db/db";
import { stocks } from "server/src/infra/db/schema/stocks.schema";
import { eq } from "drizzle-orm";

export default class StockDrizzleRepository implements StockRepository {
    async getStockByTicker(ticker: string): Promise<Stock | null> {
        const [dbStock] = await db.select().from(stocks).where(eq(stocks.ticker, ticker));
        return dbStock ? this.toDomainStock(dbStock as DbStock) : null;
    }

    async getStocks(): Promise<Stock[]> {
        const dbStocks: DbStock[] = await db.select().from(stocks);
        return dbStocks.map(this.toDomainStock);
    }

    async insertStock(stock: DbStock): Promise<Stock> {
        const [dbStock] = await db.insert(stocks).values(stock).returning();
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
            cik: db.cik,
            isin: db.isin,
            cusip: db.cusip,
            marketCap: parseFloat(db.marketCap),
            industry: db.industry,
            exchange: db.exchange,
        };
    }

}