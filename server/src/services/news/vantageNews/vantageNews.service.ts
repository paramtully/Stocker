import { NewsSummary } from "server/src/domain/news";
import StockRepository from "server/src/repositories/interfaces/stock/stocks.repository";
import StockDrizzleRepository from "server/src/repositories/drizzle/stock/stock.drizzle";
import NewsRepository from "server/src/repositories/interfaces/news/news.repository";
import NewsDrizzleRepository from "server/src/repositories/drizzle/news.drizzle.repository";

export default class VantageNews {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";
    private readonly apiKey: string;
    private readonly stocksRepository: StockRepository;
    private readonly newsRepository: NewsRepository;
    
    constructor(apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!) {
        this.apiKey = apiKey;
        this.stocksRepository = new StockDrizzleRepository();
        this.newsRepository = new NewsDrizzleRepository();
    }

    async getNewsArticles(ticker: string): Promise<NewsSummary[]> {
        return await this.newsRepository.getNewsSummaries(ticker);
    }

    async getLatestNewsSummary(ticker: string): Promise<NewsSummary | null> {
        return await this.newsRepository.getLatestNewsSummary(ticker);
    }

    async getNewsSummaries(tickers: string[]): Promise<Record<string, NewsSummary[]>> {
        return await this.newsRepository.getNewsSummariesByTickers(tickers);
    }

    async fetchAndUpdateNewsSummaries(): Promise<void> {
        // TODO: fetch news summaries from vantage news api
        // for each ticker, fetch news summaries



        const newsSummaries: Record<string, NewsSummary[]> = await this.getNewsSummaries(tickers);
        for (const ticker of tickers) {
            const newsSummary = await this.newsRepository.getNewsSummaries(ticker);
            newsSummaries[ticker] = newsSummary;
        }
        return newsSummaries;
    }
}