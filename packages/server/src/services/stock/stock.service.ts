import IStockService from "./IStock.service";
import StockRepository from "server/src/repositories/interfaces/stock/stocks.repository";
import StocksDrizzleRepository from "server/src/repositories/drizzle/stock/stock.drizzle";

export default class StockService implements IStockService {
    private readonly stockRepository: StockRepository;

    constructor() {
        this.stockRepository = new StocksDrizzleRepository();
    }

    async searchTickersByPrefix(prefix: string): Promise<string[]> {
        return (await this.stockRepository.getStocksByPrefix(prefix, 10)).map(stock => stock.ticker);
    }
}