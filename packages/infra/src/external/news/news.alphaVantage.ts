import NewsExternalService from "./news.external";
import NewsArticle from "@stocker/domain/news/newsArticle";
import { NewsHistoryStatus } from "@stocker/domain/news";
import { NewsRepository } from "@stocker/repositories/interfaces/news";
import { NewsDrizzleRepository } from "@stocker/repositories/drizzle/news";
import { NewsHistoryStatusRepository } from "@stocker/repositories/interfaces/news";
import { NewsHistoryStatusesDrizzleRepository } from "@stocker/repositories/drizzle/news";
import { StockRepository } from "@stocker/repositories/interfaces/stock";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";


export default class NewsAlphaVantage extends NewsExternalService {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";
    private readonly apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!;
    private readonly limit: number = 1000;
    private readonly sort: string = "latest";
    private readonly chunkSize: number = 200;
    private readonly delayMs: number = 1200;

    private newsRepository: NewsRepository;
    private newsHistoryStatusRepository: NewsHistoryStatusRepository;
    private stocksRepository: StockRepository;

    constructor() {
        super()
        this.newsRepository = new NewsDrizzleRepository();
        this.newsHistoryStatusRepository = new NewsHistoryStatusesDrizzleRepository();
        this.stocksRepository = new StocksDrizzleRepository();
    }

    async getAllLatestNewsArticles(tickers: string[]): Promise<Record<string, NewsArticle[]>> {

        const latestArticleDate: Date = await this.newsRepository.getDateofLatestNewsSummary();
        const newsArticles: Record<string, NewsArticle[]> = {};

        // chunk tickers into chunks of 200 (~5 articles per ticker, ~20 API calls total)
        const chunks: string[][] = [];
        for (let i = 0; i < tickers.length; i += this.chunkSize) {
            chunks.push(tickers.slice(i, i + this.chunkSize));
        }


        // fetch news articles for each chunk
        for (const chunk of chunks) {
            // delay 1200ms to avoid rate limiting
            await this.delay(this.delayMs);

            const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${chunk.join(",")}&time_from=${latestArticleDate.toISOString()}&limit=${this.limit}&sort=${this.sort}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                console.log(`AlphaVantage request failed for tickers starting at ${chunk[0]}: ${response.statusText}`);
                continue;
            }
            const data = await response.json();

            // Alpha Vantage returns { feed: [...] } structure
            // Also handle error responses like { "Note": "..." } or { "Error Message": "..." }
            if (data["Error Message"] || data["Note"]) {
                console.log(`AlphaVantage request failed for tickers starting at ${chunk[0]}: ${data["Error Message"] || data["Note"]}`);
                continue;
            }

            const feed = data.feed || [];
            if (!Array.isArray(feed)) {
                continue;
            }

            // add news articles to newsArticles
            for (const item of feed) {
                (newsArticles[item.ticker] ??= []).push({
                    ticker: item.tickerSentiment.ticker || item.ticker,
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    publishDate: new Date(item.time_published),
                    summary: item.summary,
                });
            }
        }

        return newsArticles;
    }

    async getAllHistoricalNewsArticles(): Promise<Record<string, NewsArticle[]>> {
        
        const historyStatuses: NewsHistoryStatus[] = await this.newsHistoryStatusRepository.getNewsHistoryStatuses();

        const newsArticles: Record<string, NewsArticle[]> = {};

        // filter history statuses to only include those that are not complete
        const incompleteTickers = historyStatuses.filter(status => !status.isHistoryComplete).map(status => status.ticker);

        // get earliest article date for each incomplete ticker from db
        const earliestArticleDates: Record<string, Date> = await this.newsRepository.getEarliestArticleDate(incompleteTickers);

        // loop through incomplete tickers
        for (const ticker of incompleteTickers) {   

            // delay 1200ms to avoid rate limiting
            await this.delay(this.delayMs);

            const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${ticker}&time_from=${earliestArticleDates[ticker].toISOString()}&limit=${this.limit}&sort=${this.sort}&apikey=${this.apiKey}`;
            const response = await fetch(url);

            // if request fails, throw error
            if (!response.ok) {
                console.log(`AlphaVantage request failed for ticker ${ticker}: ${response.statusText}`);
                continue;
            }

            const data = await response.json();

            // Alpha Vantage returns { feed: [...] } structure
            // Also handle error responses like { "Note": "..." } or { "Error Message": "..." }
            if (data["Error Message"] || data["Note"]) {
                console.log(`AlphaVantage request failed for ticker ${ticker}: ${data["Error Message"] || data["Note"]}`);
                continue;
            }

            const feed = data.feed || [];
            if (!Array.isArray(feed)) {
                console.log(`AlphaVantage request failed for ticker ${ticker}: Invalid feed structure`);
                continue;
            }

            // add news articles to newsArticles
            for (const item of feed) {
                (newsArticles[item.ticker] ??= []).push({
                    ticker: item.tickerSentiment.ticker || item.ticker,
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    publishDate: new Date(item.time_published),
                    summary: item.summary,
                });
            }
        }

        return newsArticles;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }   
}