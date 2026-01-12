
import Stock from "packages/domain/src/stock/stock";

export default abstract class StockExternalService {
    async getTickers(exchange: string = "NASDAQ"): Promise<string[]> {
        const tickers: string[] = [];

        const url = "https://www.sec.gov/files/company_tickers_exchange.json";
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to fetch tickers for exchange ${exchange}: ${response.statusText}`);
        }

        // check if received 
        if (!data || !data[exchange] || data[exchange].length === 0) {
            throw new Error(`No tickers found for exchange ${exchange}`);
        }

        const stockArray: string[][] = data.data;

        for (const stock of stockArray) {
            tickers.push(stock[3]);
        }

        return tickers;
    }

    abstract getAllStocks(exchange?: string): Promise<Stock[]>;
}