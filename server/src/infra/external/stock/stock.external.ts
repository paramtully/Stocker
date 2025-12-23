
import Stock from "server/src/domain/stock/stock";

export default interface StockExternalService {
    getAllStocks(exchange?: string): Promise<Stock[]>;
}