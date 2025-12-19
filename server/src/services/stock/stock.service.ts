import { ChartPeriod } from "server/src/domain/stock";
import { Quote } from "server/src/domain/stock/index";

export default interface QuoteService {
    getStocks(): Promise<Quote[]>;
    getStockQuote(ticker: string): Promise<Quote>;         // might deprecate this
    searchStocksByPrefix(prefix: string): Promise<Ticker[]>;
}