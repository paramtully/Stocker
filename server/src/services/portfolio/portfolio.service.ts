import { Holding, PortfolioOverview } from "server/src/domain/portfolio";
import IPortfolioService from "./IPortfolio.service";
import Quote from "server/src/domain/stock/quote";
import { ChartPeriod, ChartPeriodValues } from "server/src/domain/chartPeriod";
import Candle from "server/src/domain/stock/candle";
import { HoldingsDrizzleRepository } from "server/src/repositories/drizzle/portfolio";
import { CandleDrizzleRepository } from "server/src/repositories/drizzle/stock";
import { HoldingsRepository } from "server/src/repositories/interfaces/portfolio";
import { CandleRepository } from "server/src/repositories/interfaces/stock";
import Stock from "server/src/domain/stock/stock";
import StocksRepository from "server/src/repositories/interfaces/stock/stocks.repository";
import StocksDrizzleRepository from "server/src/repositories/drizzle/stock/stock.drizzle";

export default class PortfolioService implements IPortfolioService {
    private readonly holdingsRepository: HoldingsRepository;
    private readonly candlesRepository: CandleRepository;
    private readonly stocksRepository: StocksRepository;

    constructor() {
        this.candlesRepository = new CandleDrizzleRepository();
        this.holdingsRepository = new HoldingsDrizzleRepository();
        this.stocksRepository = new StocksDrizzleRepository();
    }

    async getUserHoldings(userId: string): Promise<Holding[]> {
        return await this.holdingsRepository.getUserHoldings(userId);
    }

    async getUserQuotes(userId: string): Promise<Quote[]> {
        const quotes: Quote[] = [];

        // get holdings for user
        const holdings = await this.holdingsRepository.getUserHoldings(userId);

        // Create a record for ticker to holding and stock (data relevant to create quotes)
        const quoteRecord: Record<string, { holding: Holding, stock: Stock }> = {};

        // get stocks for each ticker and add to quote record
        await Promise.all(
            holdings.map(async (holding) => {
                const stock: Stock | null = await this.stocksRepository.getStockByTicker(holding.ticker);
                if (stock) {
                    quoteRecord[holding.ticker] = { holding, stock };
                }
            })
        );

        const tickers = Object.keys(quoteRecord);

        // get candles for each ticker (sorted in chronological order (newest to oldest))
        const candles: Record<string, Candle[]> = await this.candlesRepository.get2LatestCandlesByTickers(tickers);

        // for each ticker in candles, get the change percent from the previous day, set it to 0 if there is less than 2 candles
        for (const [ticker, tickerCandles] of Object.entries(candles)) {
            const todayPrice: number = tickerCandles[0].close || tickerCandles[0].high || tickerCandles[0].low || tickerCandles[0].open || 0;
            const yesterdayPrice: number = tickerCandles[1].close || tickerCandles[1].high || tickerCandles[1].low || tickerCandles[1].open || 0;
            quotes.push({
                ticker: ticker,
                companyName: quoteRecord[ticker]?.stock.companyName || "",
                price: todayPrice,
                changePercent: tickerCandles.length >= 2 ? (todayPrice - yesterdayPrice) / yesterdayPrice * 100 : 0,
                shares: quoteRecord[ticker]?.holding.shares || 100,
                purchasePrice: quoteRecord[ticker]?.holding.purchasePrice || 0,
                purchaseDate: quoteRecord[ticker]?.holding.purchaseDate || new Date(),
            });
        }

        return quotes;
    }

    async addUserHolding(userId: string, ticker: string, shares: number, purchaseDate: Date , purchasePrice?: number): Promise<void> {
        if (!purchasePrice) {
            purchasePrice = (await this.candlesRepository.getCandleByTickerAndDate(ticker, purchaseDate))?.close || 0;
        }
        const holding: Holding = {
            userId: userId,
            ticker: ticker,
            shares: shares,
            purchaseDate: purchaseDate,
            purchasePrice: purchasePrice || 0,
        };
        await this.holdingsRepository.insertHolding(holding);
    }

    async removeUserHolding(userId: string, ticker: string): Promise<void> {
        return await this.holdingsRepository.deleteHolding(userId, ticker);
    }

    async getPortfolioOverview(userId: string): Promise<PortfolioOverview> {
        const holdings = await this.holdingsRepository.getUserHoldings(userId);
        const initialValue: number = holdings.reduce((acc, holding) => acc + holding.shares * holding.purchasePrice, 0);
        const quotes: Quote[] = await this.getUserQuotes(userId);

        const currentValue: number = quotes.reduce((acc, quote) => acc + quote.price * (holdings.find((holding) => holding.ticker == quote.ticker)?.shares || 1), 0);
        return {
            totalValue: currentValue,
            dailyChange: this.getDailyChange(quotes, holdings),
            dailyChangePercent: this.getDailyChangePercent(quotes, holdings),
            totalGain: currentValue - initialValue,
            totalGainPercent: initialValue > 0 ? (currentValue - initialValue) / initialValue * 100 : 0,
            stockCount: holdings.length,
        };
    }

     
    // Get total dollar change in portfolio value over the last day
    private getDailyChange(quotes: Quote[], holdings: Holding[]): number {
        return holdings.reduce((totalChange, holding) => {
            const quote = quotes.find(q => q.ticker === holding.ticker);
            if (!quote || quote.changePercent === 0) return totalChange;
            
            // Calculate yesterday's price from today's price and change percent
            // changePercent = (todayPrice - yesterdayPrice) / yesterdayPrice * 100
            // Solving for yesterdayPrice: yesterdayPrice = todayPrice / (1 + changePercent/100)
            const yesterdayPrice = quote.price / (1 + quote.changePercent / 100);
            const priceChange = quote.price - yesterdayPrice;
            
            // Dollar change = price change per share * number of shares
            return totalChange + (priceChange * holding.shares);
        }, 0);
    }

    // Get overall percent change of portfolio over the last day
    private getDailyChangePercent(quotes: Quote[], holdings: Holding[]): number {
        let yesterdayTotalValue = 0;
        let todayTotalValue = 0;
        
        for (const holding of holdings) {
            const quote = quotes.find(q => q.ticker === holding.ticker);
            if (!quote) continue;
            
            // Calculate yesterday's price
            const yesterdayPrice = quote.changePercent !== 0 
                ? quote.price / (1 + quote.changePercent / 100)
                : quote.price;
            
            const holdingValueYesterday = yesterdayPrice * holding.shares;
            const holdingValueToday = quote.price * holding.shares;
            
            yesterdayTotalValue += holdingValueYesterday;
            todayTotalValue += holdingValueToday;
        }
        
        if (yesterdayTotalValue === 0) return 0;
        
        return yesterdayTotalValue > 0 ? ((todayTotalValue - yesterdayTotalValue) / yesterdayTotalValue) * 100 : 0;
    }


    async getPortfolioCharts(userId: string): Promise<Record<string, Record<ChartPeriod, Candle[]>>> {
        const holdings = await this.holdingsRepository.getUserHoldings(userId);
        const tickers = holdings.map((holding) => holding.ticker);

        const charts: Record<string, Record<ChartPeriod, Candle[]>> = {};

        Promise.all(ChartPeriodValues.map(async (period) => {
            const tickerCharts: Record<string, Candle[]> = await this.candlesRepository.getCandlesByTickersAndPeriod(tickers, period);
            Object.entries(tickerCharts).forEach(([ticker, candles]) => {
                charts[ticker][period] = candles;
            });
        }));

        return charts;
    }
}