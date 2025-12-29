import IStockService from "./IStock.service";
import StockRepository from "server/src/repositories/interfaces/stock/stocks.repository";
import StocksDrizzleRepository from "server/src/repositories/drizzle/stock/stock.drizzle";

export default class StockService implements IStockService {
    private readonly stockRepository: StockRepository;

    constructor() {
        this.stockRepository = new StocksDrizzleRepository();
    }

    async searchTickersByPrefix(prefix: string): Promise<string[]> {
        return await this.stockRepository.getStocks().then(stocks => stocks.filter(stock => stock.ticker.startsWith(prefix)).map(stock => stock.ticker));
    }
}