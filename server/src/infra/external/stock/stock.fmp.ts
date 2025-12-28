import Stock from "server/src/domain/stock/stock";
import StockExternalService from "./stock.external";

interface FmpProfile {
    symbol: string; // Ticker symbol
    companyName: string; // Full company name
    exchange: string; // Stock exchange (e.g., NYSE, NASDAQ)
    industry: string; // Industry the company belongs to
    sector: string; // Sector the company operates in
    description: string; // Description of the company and its services
    ceo: string; // CEO name (if available)
    country: string; // Country the company is based in
    website: string; // Official company website URL
    address: string; // Company address (city or general location)
    phone: string | null; // Company phone number (nullable)
    ipoDate: string; // IPO date or founding date (in string format)
    image: string | null; // URL to an image of the company (nullable)
    marketCap: number; // Market capitalization in string format
    price: string; // Current stock price
    range: string; // 52-week price range (e.g., "46.41-66.81")
    volume: string; // Current trading volume
    averageVolume: string; // Average trading volume
    change: string; // Change in stock price
    changePercentage: string; // Percentage change in stock price
    beta: string; // Beta value (volatility measure)
    lastDividend: string; // Last dividend paid
    cik: string; // CIK code
    isin: string; // ISIN code
    cusip: string; // CUSIP code
    isEtf: boolean; // Whether it is an ETF
    isActivelyTrading: boolean; // Whether the stock is actively trading
    isAdr: boolean; // Whether it's an ADR (American Depositary Receipt)
    isFund: boolean; // Whether it is a Fund
    fullTimeEmployees: string | null; // Number of full-time employees (nullable)
    defaultImage: string | null; // URL to default image or placeholder (nullable)
}
  
  
// NOTE: DOESNT WORK BECAUSE THE API ISN'T FREE :(
export default class StockFmp extends StockExternalService {
    private readonly baseUrl: string = "https://financialmodelingprep.com/api/v3";
    private readonly apiKey: string = process.env.FMP_API_KEY!;

    async getAllStocks(exchange: string = "NASDAQ"): Promise<Stock[]> {
        const results: Stock[] = [];
        let part = 0;
      
        while (true) {
            const url = `${this.baseUrl}/stable/profile-bulk?part=${part}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`FMP request failed at part=${part}`);
            }
            const csvData = await response.text();

            // Stop when no more data
            if (!csvData || csvData.trim().length === 0) {
                break;
            }

             // Parse CSV to array of objects
             const data: string[][] = csvData.split("\n").map(line => line.split(","));
             const profiles: FmpProfile[] = data.map(row => ({
                symbol: row[0],
                companyName: row[1],
                exchange: row[2],
                industry: row[3],
                sector: row[4],
                description: row[5],
            }) as FmpProfile);

            results.push(...profiles
                .filter(profile => profile.exchange === exchange)
                .map(profile => {
                    return {
                    ticker: profile.symbol,
                    companyName: profile.companyName,
                    cik: profile.cik,
                    isin: profile.isin,
                    cusip: profile.cusip,
                    marketCap: profile.marketCap,
                    industry: profile.industry,
                    exchange: profile.exchange,
                } as Stock
                }));
            part++;
            await this.delay(300);
        }
        return results;
    }
    

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}