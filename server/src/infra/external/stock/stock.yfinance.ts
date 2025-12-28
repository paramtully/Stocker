import Stock from "server/src/domain/stock/stock";
import StockExternalService from "./stock.external";
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();

export default class StockYfinance extends StockExternalService {
    private readonly baseUrl: string = "https://stocks.adgstudios.co.za";
    private readonly apiKey: string = process.env.YFINANCE_API_KEY!;



    async getAllStocks(): Promise<Stock[]> {
        const tickers = await super.getTickers();
        const stocks: Stock[] = [];

        tickers.map(async (ticker) => {
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
        });
        return stocks;
    }
}