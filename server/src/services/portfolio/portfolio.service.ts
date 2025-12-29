import { Holding, PortfolioOverview } from "server/src/domain/portfolio";
import IPortfolioService from "./IPortfolio.service";
import Quote from "server/src/domain/stock/quote";
import { ChartPeriod } from "server/src/domain/chartPeriod";
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
        return await this.holdingsRepository.getHoldingsByUserId(userId);
    }

    async getUserQuotes(userId: string): Promise<Quote[]> {
        const quotes: Quote[] = [];

        // get holdings for user
        const holdings = await this.holdingsRepository.getHoldingsByUserId(userId);

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
        const candles: Record<string, Candle[]> = await this.candlesRepository.getCandlesByTickers(tickers);

        // for each ticker in candles, get the change percent from the previous day, set it to 0 if there is less than 2 candles
        for (const [ticker, tickerCandles] of Object.entries(candles)) {
            quotes.push({
                ticker: ticker,
                companyName: quoteRecord[ticker]?.stock.companyName || "",
                price: tickerCandles[0].close,
                changePercent: tickerCandles.length > 1 ? (tickerCandles[0].close - tickerCandles[1].close) / tickerCandles[1].close * 100 : 0,
            });

        }

        return quotes;
    }

    async addUserHolding(Hold): Promise<void> {
        await this.holdingsRepository.insertHolding({
    }

    async removeUserHolding(userId: string, ticker: string): Promise<void> {
        return await this.holdingsRepository.removeUserHolding(userId, ticker);
    }

    async getPortfolioOverview(userId: string): Promise<PortfolioOverview> {
        return null;
    }

    async getPortfolioCharts(userId: string, ticker: string, period: ChartPeriod): Promise<Record<string, Candle[]>> {
        return await this.candlesRepository.getCandlesByTicker(ticker, period);
    }
}