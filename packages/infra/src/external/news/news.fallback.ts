import NewsExternalService from "./news.external";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsAlphaVantage from "./news.alphaVantage";
// Future: Import other news providers as they're added
// import NewsPolygon from "./news.polygon";
// import NewsFinnhub from "./news.finnhub";

/**
 * Fallback service that tries multiple news data providers
 * Falls back to next provider if one fails
 */
export default class NewsFallbackService implements NewsExternalService {
    private providers: NewsExternalService[];
    private errorLog: Array<{ provider: string; error: string; timestamp: string; ticker?: string }> = [];

    constructor() {
        // Order matters - try most reliable first
        this.providers = [
            new NewsAlphaVantage(),
            // Add other providers here as they're implemented
            // new NewsPolygon(),
            // new NewsFinnhub(),
        ];
    }

    async getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>> {
        const results: Record<string, NewsArticle[]> = {};
        const failedTickers: string[] = [];

        // Try to fetch all tickers with first provider
        for (const provider of this.providers) {
            try {
                const providerResults = await provider.getAllLatestNewsArticles(tickers, latestArticleDate);
                
                // Merge results
                for (const [ticker, articles] of Object.entries(providerResults)) {
                    if (articles && articles.length > 0) {
                        results[ticker] = articles;
                    }
                }

                // Check which tickers are still missing
                const missingTickers = tickers.filter(t => !results[t] || results[t].length === 0);
                
                if (missingTickers.length === 0) {
                    // All tickers succeeded
                    return results;
                }

                // Some tickers failed, try next provider for missing ones
                tickers = missingTickers;
            } catch (error) {
                this.logError(provider.constructor.name, error);
                // Continue to next provider
                continue;
            }
        }

        // Track failed tickers
        for (const ticker of tickers) {
            if (!results[ticker] || results[ticker].length === 0) {
                failedTickers.push(ticker);
            }
        }

        if (failedTickers.length > 0) {
            console.warn(`Failed to fetch latest news for tickers: ${failedTickers.join(", ")}`);
        }

        return results;
    }

    async getAllHistoricalNewsArticles(tickers: string[]): Promise<Record<string, NewsArticle[]>> {
        const results: Record<string, NewsArticle[]> = {};
        const failedTickers: string[] = [];

        // Process tickers one by one with fallback
        for (const ticker of tickers) {
            let success = false;
            
            for (const provider of this.providers) {
                try {
                    const tickerResult = await provider.getAllHistoricalNewsArticles([ticker]);
                    
                    if (tickerResult[ticker] && tickerResult[ticker].length > 0) {
                        results[ticker] = tickerResult[ticker];
                        success = true;
                        break; // Success, move to next ticker
                    }
                } catch (error) {
                    this.logError(provider.constructor.name, error, ticker);
                    continue; // Try next provider
                }
            }

            if (!success) {
                failedTickers.push(ticker);
            }
        }

        if (failedTickers.length > 0) {
            console.warn(`Failed to fetch historical news for tickers: ${failedTickers.join(", ")}`);
        }

        return results;
    }

    private logError(providerName: string, error: unknown, ticker?: string): void {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.errorLog.push({
            provider: providerName,
            error: ticker ? `${errorMsg} (ticker: ${ticker})` : errorMsg,
            timestamp: new Date().toISOString(),
            ticker,
        });
    }

    getErrorLog(): Array<{ provider: string; error: string; timestamp: string; ticker?: string }> {
        return [...this.errorLog];
    }

    clearErrorLog(): void {
        this.errorLog = [];
    }
}

