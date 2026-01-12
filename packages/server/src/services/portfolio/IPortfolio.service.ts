import Holding from "packages/domain/src/portfolio/holding";
import Quote from "packages/domain/src/stock/quote";
import PortfolioOverview from "packages/domain/src/portfolio/portfolioOverview";
import Candle from "packages/domain/src/stock/candle";
import { ChartPeriod } from "packages/domain/src/chartPeriod";

export default interface IPortfolioService {
    getUserHoldings(userId: string): Promise<Holding[]>;
    getUserQuotes(userId: string): Promise<Quote[]>;
    addUserHolding(userId: string, ticker: string, shares: number, purchaseDate: Date , purchasePrice?: number): Promise<void>;
    removeUserHolding(userId: string, ticker: string): Promise<void>;
    getPortfolioOverview(userId: string): Promise<PortfolioOverview>;

    // return chart for each resolution in chart period
    getPortfolioCharts(userId: string): Promise<Record<string, Record<ChartPeriod, Candle[]>>>;
}