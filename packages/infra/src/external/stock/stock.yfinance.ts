import Stock from "packages/domain/src/stock/stock";
import StockExternalService from "./stock.external";
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();

export default class StockYfinance extends StockExternalService {
    private readonly baseUrl: string = "https://stocks.adgstudios.co.za";
    private readonly apiKey: string = process.env.YFINANCE_API_KEY!;


    async getAllStocks(exchange: string = "NASDAQ"): Promise<Stock[]> {
        const tickers = await super.getTickers(exchange);
        const stocks: Stock[] = [];

        for (const ticker of tickers) {
            try {
                const data = await yf.quoteSummary(ticker, {
                  modules: [
                    "price",
                    "summaryDetail",
                    "summaryProfile",
                    "quoteType"
                  ]
                })
      
                stocks.push({
                  ticker,
                  companyName: data.price?.shortName ?? data.quoteType?.longName ?? "",
                  marketCap: data.summaryDetail?.marketCap ?? 0,
                  industry: data.summaryProfile?.industry ?? "",
                  exchange: data.price?.exchangeName ?? ""
                } as Stock);
              } catch (error) {
                console.error(`Error fetching stock for ${ticker}:`, error);
              }
              
              // Add delay to avoid rate limiting (Yahoo Finance has rate limits)
              await this.delay(1800);
        }
        return stocks;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}