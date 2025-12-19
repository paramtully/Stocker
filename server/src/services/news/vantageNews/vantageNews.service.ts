import { NewsSummary } from "server/src/domain/news";


export default class VantageNews {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";
    private readonly apiKey: string;
    
    constructor(apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!) {
        this.apiKey = apiKey;
    }

    async getNews(): Promise<NewsSummary[]> {
        // TODO: get user stocks from database
        const stocks = await this.stocksRepository.getStocks();

        // if none and in guest mode, use default tickers

        // otherwise, fetch paginated news summaries for each stock

        // return news summaries
        return [];
    }
}