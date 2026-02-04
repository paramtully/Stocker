import { Candle } from "packages/domain/stock";
import YahooFinance from "yahoo-finance2";
import { HistoricalRowHistory, HistoricalRowStockSplit } from "yahoo-finance2/modules/historical";
import CandleExternalService from "./candle.external";
const yf = new YahooFinance();

// interface YfinanceCandle {
//     Open: number;
//     High: number;
//     Low: number;
//     Close: number;
//     Volume: number;
//     Timestamp: number;
//     Dividends: number;
//     "Stock Splits": number;
// }

export default class CandleYfinance implements CandleExternalService {
    async getCurrentlyListedNasdaqTickers(): Promise<string[]> {
        const url = `https://dumbstockapi.com/stock?exchanges=NASDAQ&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        return data.map((item: { ticker: string }) => item.ticker);
    }

    // async getHistoricalCandles(tickers: string[]): Promise<Record<string, Candle[]>> {
    //     const results: Record<string, Candle[]> = {};
    //     for (const ticker of tickers) {
    //         const url = `${this.baseUrl}/json/${ticker}`;
    //         const response = await fetch(url);
    //         const data = await response.json();
    //         const candles: Candle[] = data.map((item: YfinanceCandle) => ({
    //             ticker,
    //             open: item.Open,
    //             high: item.High,
    //             low: item.Low,
    //             close: item.Close,
    //             volume: item.Volume,
    //             date: new Date(item.Timestamp),
    //         }));
    //         if (candles.length === 0) {
    //             console.log(`No candles found for ${ticker}`);
    //             continue;
    //         }
    //         // assure candles are sorted by date
    //         candles.sort((a: Candle, b: Candle) => a.date.getTime() - b.date.getTime());
    //         results[ticker] = candles;

    //         // delay 500ms to avoid rate limiting (~7000 requests per hour)
    //         await this.delay(500);
    //     }
    //     return results;
    // }


    // backup implementation using yfinance package
    async getHistoricalCandles(tickers: string[]): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        for (const ticker of tickers) {
            // start at today and end at tomorrow
            const startDate = "1970-01-01"; // arbitrary date to get all historical candles
            const endDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];

            // Fetch candles and splits in parallel
            const [candlesResponse, splits] = await Promise.all([
                yf.historical(ticker, { period1: startDate, period2: endDate }),
                this.getStockSplits(ticker, startDate, endDate)
            ]);

            if (candlesResponse.length === 0) {
                console.log(`No candles found for ${ticker}`);
                continue;
            }

            let candles: Candle[] = candlesResponse
                .map((item: HistoricalRowHistory) => ({
                    ticker,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume,
                    date: new Date(item.timestamp as number),
                }));

            // assure candles are sorted by date
            candles.sort((a: Candle, b: Candle) => a.date.getTime() - b.date.getTime());

            // Adjust candles for splits
            candles = this.adjustCandlesForSplits(candles, splits);

            results[ticker] = candles;

            // delay 1800ms to avoid rate limiting (2000 requests per hour)
            await this.delay(1800);
        }
        return results;
    }

    async getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        for (const ticker of tickers) {
            const startDateStr = startDate.toISOString().split("T")[0];
            const endDateStr = endDate.toISOString().split("T")[0];

            // Fetch candles and splits in parallel
            const [candlesResponse, splits] = await Promise.all([
                yf.historical(ticker, { period1: startDateStr, period2: endDateStr }),
                this.getStockSplits(ticker, startDateStr, endDateStr)
            ]);

            if (candlesResponse.length === 0) {
                console.log(`No candles found for ${ticker}`);
                continue;
            }

            let candles: Candle[] = candlesResponse
                .map((item: HistoricalRowHistory) => ({
                    ticker,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume,
                    date: new Date(item.timestamp as number),
                }));

            // assure candles are sorted by date
            candles.sort((a: Candle, b: Candle) => a.date.getTime() - b.date.getTime());

            // Adjust candles for splits
            candles = this.adjustCandlesForSplits(candles, splits);

            results[ticker] = candles;

            // delay 1800ms to avoid rate limiting (2000 requests per hour)
            await this.delay(1800);
        }
        return results;
    }


    async getDailyCandles(tickers: string[]): Promise<Record<string, Candle[]>> {
        // get set dates for today and tomorrow
        const startDate: Date = new Date()
        const endDate: Date = new Date(new Date().setDate(new Date().getDate() + 1))
        return this.getRangeCandles(tickers, startDate, endDate);
    }

    async getStockSplits(ticker: string, startDate: string, endDate: string): Promise<Array<{ date: Date; ratio: number }>> {
        try {
            const splitsResponse = await yf.historical(ticker, {
                period1: startDate,
                period2: endDate,
                events: "split"
            }) as HistoricalRowStockSplit[];

            return splitsResponse.map((split: HistoricalRowStockSplit) => {
                // Parse split ratio from string like "4:1" or "1:4"
                const parts = split.stockSplits.split(':');
                if (parts.length !== 2) {
                    console.warn(`Invalid split format for ${ticker}: ${split.stockSplits}, skipping`);
                    return null;
                }

                const numerator = parseFloat(parts[0]);
                const denominator = parseFloat(parts[1]);

                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
                    console.warn(`Invalid split ratio for ${ticker}: ${split.stockSplits}, skipping`);
                    return null;
                }

                return {
                    date: split.date,
                    ratio: numerator / denominator
                };
            })
                .filter((split): split is { date: Date; ratio: number } => split !== null)
                .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort chronologically
        } catch (error) {
            console.warn(`Failed to fetch splits for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    private adjustCandlesForSplits(candles: Candle[], splits: Array<{ date: Date; ratio: number }>): Candle[] {
        if (splits.length === 0) {
            return candles;
        }

        // Process splits in reverse chronological order (newest first)
        // This way we apply the most recent split first, then work backwards
        const sortedSplits = [...splits].sort((a, b) => b.date.getTime() - a.date.getTime());

        return candles.map(candle => {
            // Skip adjustment if candle date is invalid
            if (!candle.date || isNaN(candle.date.getTime())) {
                console.warn(`Invalid candle date for ticker ${candle.ticker}, skipping split adjustment`);
                return candle;
            }

            let adjustedCandle = { ...candle };

            // Apply all splits that occurred AFTER this candle's date
            // (prices before a split need to be adjusted down)
            for (const split of sortedSplits) {
                // Skip invalid splits
                if (!split.date || isNaN(split.date.getTime()) || !split.ratio || isNaN(split.ratio) || split.ratio === 0) {
                    continue;
                }

                if (candle.date < split.date) {
                    // This candle occurred before the split, so adjust prices down
                    adjustedCandle = {
                        ...adjustedCandle,
                        open: adjustedCandle.open / split.ratio,
                        high: adjustedCandle.high / split.ratio,
                        low: adjustedCandle.low / split.ratio,
                        close: adjustedCandle.close / split.ratio,
                        volume: adjustedCandle.volume * split.ratio, // Volume increases
                    };
                }
            }

            return adjustedCandle;
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}