import NewsExternalService from "./news.external";
import NewsArticle from "@stocker/domain/news/newsArticle";


export default class NewsAlphaVantage extends NewsExternalService {
    private readonly baseUrl: string = "https://www.alphavantage.co/query";
    private readonly apiKey: string = process.env.ALPHA_VANTAGE_API_KEY!;
    private readonly limit: number = 1000;
    private readonly sort: string = "oldest";
    private readonly chunkSize: number = 200;
    private readonly delayMs: number = 1200;

    constructor() {
        super();
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

    async getAllHistoricalNewsArticles(tickers: string[]): Promise<Record<string, NewsArticle[]>> {

        const newsArticles: Record<string, NewsArticle[]> = {};

        // loop through tickers
        for (const ticker of tickers) {

            // delay 1200ms to avoid rate limiting
            await this.delay(this.delayMs);

            const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${ticker}&time_from=1970-01-01&limit=${this.limit}&sort=${this.sort}&apikey=${this.apiKey}`;
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