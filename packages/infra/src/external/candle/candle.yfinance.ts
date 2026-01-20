import { Candle } from "packages/domain/stock";
import YahooFinance from "yahoo-finance2";
import { HistoricalRowHistory } from "yahoo-finance2/modules/historical";
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
            const candlesResponse = await yf.historical(ticker, { period1: startDate, period2: endDate });
            if (candlesResponse.length === 0) {
                console.log(`No candles found for ${ticker}`);
                continue;
            }
            const candles: Candle[] = candlesResponse
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
            results[ticker] = candles;

            // delay 1800ms to avoid rate limiting (2000 requests per hour)
            await this.delay(1800);
        }
        return results;
    }

    async getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Record<string, Candle[]>> {
        const results: Record<string, Candle[]> = {};
        for (const ticker of tickers) {
            const candlesResponse = await yf.historical(ticker, { period1: startDate.toISOString().split("T")[0], period2: endDate.toISOString().split("T")[0] });
            if (candlesResponse.length === 0) {
                console.log(`No candles found for ${ticker}`);
                continue;
            }
            const candles: Candle[] = candlesResponse
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

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}