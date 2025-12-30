import NewsExternalService from "./news.external";
import NewsArticle from "server/src/domain/news/newsArticle";
import { NewsHistoryStatus } from "server/src/domain/news";
import NewsRepository from "server/src/repositories/interfaces/news/news.repository";
import NewsDrizzleRepository from "server/src/repositories/drizzle/news/news.drizzle.repository";
import NewsHistoryStatusRepository from "server/src/repositories/interfaces/news/newsHistoryStatus.repository";
import NewsHistoryStatusDrizzleRepository from "server/src/repositories/drizzle/news/newsHistoryStatus.drizzle";

export default class NewsAlphaVantage implements NewsExternalService {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";
    private readonly apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!;
    private readonly limit: number = 1000;
    private readonly sort: string = "latest";
    private readonly chunkSize: number = 200;
    private readonly delayMs: number = 1200;

    private newsRepository: NewsRepository;
    private newsHistoryStatusRepository: NewsHistoryStatusRepository;

    constructor() {
        this.newsRepository = new NewsDrizzleRepository();
        this.newsHistoryStatusRepository = new NewsHistoryStatusDrizzleRepository();
    }

    async getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>> {

        const newsArticles: Record<string, NewsArticle[]> = {};

        // chunk tickers into chunks of 200 (~5 articles per ticker, ~20 API calls total)
        const chunks: string[][] = [];
        for (let i = 0; i < tickers.length; i += this.chunkSize) {
            chunks.push(tickers.slice(i, i + this.chunkSize));
        }


        // fetch news articles for each chunk
        for (const chunk of chunks) {
            const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${chunk.join(",")}&time_from=${latestArticleDate.toISOString()}&limit=${this.limit}&sort=${this.sort}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`AlphaVantage request failed: ${response.statusText}`);
            }
            const data = await response.json();

            // Alpha Vantage returns { feed: [...] } structure
            // Also handle error responses like { "Note": "..." } or { "Error Message": "..." }
            if (data["Error Message"] || data["Note"]) {
                console.log(`AlphaVantage request failed for tickers starting at ${chunk[0]}: ${data["Error Message"] || data["Note"]}`);
                return newsArticles;
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

            // delay 1200ms to avoid rate limiting
            await this.delay(this.delayMs);
        }

        return newsArticles;
    }

    async getAllHistoricalNewsArticles(historyStatuses: NewsHistoryStatus[]): Promise<Record<string, NewsArticle[]>> {

        const newsArticles: Record<string, NewsArticle[]> = {};

        // filter history statuses to only include those that are not complete
        const incompleteTickers = historyStatuses.filter(status => !status.isHistoryComplete).map(status => status.ticker);

        // get earliest article date for each incomplete ticker from db
        const earliestArticleDates: Record<string, Date> = await this.newsRepository.getEarliestArticleDate(incompleteTickers) ?? {};

        // loop through incomplete tickers
        for (const ticker of incompleteTickers) {   

            const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${ticker}&time_from=${earliestArticleDates[ticker].toISOString()}&limit=${this.limit}&sort=${this.sort}&apikey=${this.apiKey}`;
            const response = await fetch(url);

            // if request fails, throw error
            if (!response.ok) {
                throw new Error(`AlphaVantage request failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Alpha Vantage returns { feed: [...] } structure
            // Also handle error responses like { "Note": "..." } or { "Error Message": "..." }
            if (data["Error Message"] || data["Note"]) {
                console.log(`AlphaVantage request failed for ticker ${ticker}: ${data["Error Message"] || data["Note"]}`);
                return newsArticles;
            }

            const feed = data.feed || [];
            if (!Array.isArray(feed)) {
                return newsArticles;
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

            // delay 1200ms to avoid rate limiting
            await this.delay(this.delayMs);
        }

        return newsArticles;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }   
}