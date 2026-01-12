import { Stock } from "packages/domain/src/stock";
import { DbStock } from "../../../../db/src/schema/stocks.schema";

export default interface StocksRepository {
    getStockByTicker(ticker: string): Promise<Stock | null>;
    getStocks(): Promise<Stock[]>;                              // get all stocks from database
    getStocksByPrefix(prefix: string, limit?: number): Promise<Stock[]>;
    insertStock(stock: DbStock): Promise<Stock>;
    deleteStock(ticker: string): Promise<void>;
    updateStock(stock: DbStock): Promise<Stock>;
    toDomainStock(db: DbStock): Stock;
}