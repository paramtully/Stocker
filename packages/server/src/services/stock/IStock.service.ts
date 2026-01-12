
export default interface IStockService {
    searchTickersByPrefix(prefix: string): Promise<string[]>;   // search NASDAQ tickers by prefix
}