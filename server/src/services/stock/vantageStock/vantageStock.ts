import { Quote } from "server/src/domain/stock";
import dotenv from "dotenv";
dotenv.config();

export default class VantageStock {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";

    constructor(apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!) {
        this.apiKey = apiKey;
    }

    async getQuote(ticker: string): Promise<Quote | null> {
        try {
            const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.key}`;
            const response = await fetch(url);
            const data = await response.json();
      
            if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
              const quote = data["Global Quote"];
              return {
                ticker: quote["01. symbol"],
                price: parseFloat(quote["05. price"]),
                changePercent: parseFloat(quote["10. change percent"]?.replace("%", "") || "0"),
                companyName: ticker,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching quote for ${ticker}:`, error);
            return null;
          }
    }
}