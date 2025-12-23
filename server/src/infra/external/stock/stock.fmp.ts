import Stock from "server/src/domain/stock/stock";
import StockExternalService from "./stock.external";

export default class StockFmp implements StockExternalService {
    private readonly baseUrl: string = process.env.FMP_BASE_URL! || "https://financialmodelingprep.com/api/v3";
    private readonly apiKey: string = process.env.FMP_API_KEY!;

    async getAllStocks(exchange: string = "NASDAQ"): Promise<Stock[]> {
        const results: Stock[] = [];
        let part = 0;
      
        while (true) {
            const url = `${this.baseUrl}?part=${part}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`FMP request failed at part=${part}`);
            }
            const data: Stock[] = await response.json();

            // Stop when no more data
            if (!Array.isArray(data) || data.length === 0) {
                break;
            }
            
            results.push(...data.filter(item => item.exchange === exchange));
            part++;
            await this.delay(300);
        }
        return results;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}