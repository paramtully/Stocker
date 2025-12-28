import { Stock } from "server/src/domain/stock";
import { DbStock } from "server/src/infra/db/schema/stocks.schema";

export default interface StocksRepository {
    getStockByTicker(ticker: string): Promise<Stock | null>;
    getStocks(): Promise<Stock[]>;                              // get all stocks from database
    insertStock(stock: DbStock): Promise<Stock>;
    deleteStock(ticker: string): Promise<void>;
    updateStock(stock: DbStock): Promise<Stock>;
    toDomainStock(db: DbStock): Stock;
}