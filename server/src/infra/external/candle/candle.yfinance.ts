import Candle from "server/src/domain/stock/candle";
import YahooFinance from "yahoo-finance2";
import { HistoricalRowHistory } from "yahoo-finance2/modules/historical";
import CandleExternalService from "./candle.external";
const yf = new YahooFinance();

interface YfinanceCandle {
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
    Timestamp: number;
    Dividends: number;
    "Stock Splits": number;
}

export default class CandleYfinance implements CandleExternalService {
    private readonly baseUrl: string = "https://stocks.adgstudios.co.za";
    private readonly apiKey: string = process.env.YFINANCE_API_KEY!;

    async getHistoricalCandles(tickers: string[]): Promise<Candle[]> {
        const results: Candle[] = [];
        for (const ticker of tickers) {
            const url = `${this.baseUrl}/json/${ticker}`;
            const response = await fetch(url);
            const data = await response.json();
            const candle: Candle[] = data.map((item: YfinanceCandle) => ({
                ticker,
                open: item.Open,
                high: item.High,
                low: item.Low,
                close: item.Close,
                volume: item.Volume,
                date: new Date(item.Timestamp),
            }));
            results.push(...candle);
        }
        return results;
    }

    async getDailyCandles(tickers: string[]): Promise<Candle[]> {
        const results: Candle[] = [];
        for (const ticker of tickers) {
            const date = new Date();
            const candles = await yf.historical(ticker, { period1: date.getTime() / 1000, period2: (date.getTime() + 1) / 1000 });
            const candle: Candle[] = candles
            .map((item: HistoricalRowHistory) => ({
                ticker,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
                date: new Date(item.timestamp as number),
            }));
            results.push(...candle);
        }
        return results;
    }

    async getRangeCandles(tickers: string[], startDate: Date, endDate: Date): Promise<Candle[]> {
        const results: Candle[] = [];
        for (const ticker of tickers) {
            const candles = await yf.historical(ticker, { period1: startDate.getTime() / 1000, period2: endDate.getTime() / 1000 });
            const candle: Candle[] = candles
            .map((item: HistoricalRowHistory) => ({
                ticker,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
                date: new Date(item.timestamp as number),
            }));
            results.push(...candle);
        }
        return results;
    }
}