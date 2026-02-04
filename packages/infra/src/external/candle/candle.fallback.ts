import CandleExternalService from "./candle.external";
import { Candle } from "@stocker/domain/stock/candle";
import CandleYfinance from "./candle.yfinance";
// Future: Import other providers as they're added
// import CandlePolygon from "./candle.polygon";
// import CandleAlphaVantage from "./candle.alphaVantage";

/**
 * Fallback service that tries multiple candle data providers
 * Falls back to next provider if one fails
 */
export default class CandleFallbackService implements CandleExternalService {
    private providers: CandleExternalService[];
    private errorLog: Array<{ provider: string; error: string; timestamp: string; ticker?: string }> = [];

    constructor() {
        // Order matters - try most reliable first
        this.providers = [
            new CandleYfinance(),
            // Add other providers here as they're implemented
            // new CandlePolygon(),
            // new CandleAlphaVantage(),
        ];
    }

    async getCurrentlyListedNasdaqTickers(): Promise<string[]> {
        for (const provider of this.providers) {
            try {
                return await provider.getCurrentlyListedNasdaqTickers();
            } catch (error) {
                this.logError(provider.constructor.name, error);
                continue;
            }
        }
        throw new Error("All candle providers failed for getCurrentlyListedNasdaqTickers");
    }

    async getHistoricalCandles(tickers: string[]): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        const failedTickers: string[] = [];

        for (const ticker of tickers) {
            let success = false;
            for (const provider of this.providers) {
                try {
                    const tickerResult = await provider.getHistoricalCandles([ticker]);
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
            console.warn(`Failed to fetch historical candles for tickers: ${failedTickers.join(", ")}`);
        }

        return results;
    }

    async getDailyCandles(tickers: string[]): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        const failedTickers: string[] = [];

        for (const ticker of tickers) {
            let success = false;
            for (const provider of this.providers) {
                try {
                    const tickerResult = await provider.getDailyCandles([ticker]);
                    if (tickerResult[ticker] && tickerResult[ticker].length > 0) {
                        results[ticker] = tickerResult[ticker];
                        success = true;
                        break;
                    }
                } catch (error) {
                    this.logError(provider.constructor.name, error, ticker);
                    continue;
                }
            }
            if (!success) {
                failedTickers.push(ticker);
            }
        }

        if (failedTickers.length > 0) {
            console.warn(`Failed to fetch daily candles for tickers: ${failedTickers.join(", ")}`);
        }

        return results;
    }

    async getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        const failedTickers: string[] = [];

        for (const ticker of tickers) {
            let success = false;
            for (const provider of this.providers) {
                try {
                    const tickerResult = await provider.getRangeCandles([ticker], startDate, endDate);
                    if (tickerResult[ticker] && tickerResult[ticker].length > 0) {
                        results[ticker] = tickerResult[ticker];
                        success = true;
                        break;
                    }
                } catch (error) {
                    this.logError(provider.constructor.name, error, ticker);
                    continue;
                }
            }
            if (!success) {
                failedTickers.push(ticker);
            }
        }

        if (failedTickers.length > 0) {
            console.warn(`Failed to fetch range candles for tickers: ${failedTickers.join(", ")}`);
        }

        return results;
    }

    async getStockSplits(ticker: string, startDate: string, endDate: string): Promise<Array<{ date: Date; ratio: number }>> {
        for (const provider of this.providers) {
            try {
                // Check if provider has getStockSplits method
                if ('getStockSplits' in provider && typeof provider.getStockSplits === 'function') {
                    return await (provider as any).getStockSplits(ticker, startDate, endDate);
                }
            } catch (error) {
                this.logError(provider.constructor.name, error, ticker);
                continue;
            }
        }
        // If no provider supports splits, return empty array
        console.warn(`No provider supports getStockSplits for ${ticker}`);
        return [];
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

