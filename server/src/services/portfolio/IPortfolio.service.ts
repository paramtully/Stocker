import Holding from "server/src/domain/portfolio/holding";
import Quote from "server/src/domain/stock/quote";
import PortfolioOverview from "server/src/domain/portfolio/portfolioOverview";
import Candle from "server/src/domain/stock/candle";
import { ChartPeriod } from "server/src/domain/chartPeriod";

export default interface IPortfolioService {
    getUserHoldings(userId: string): Promise<Holding[]>;
    getUserQuotes(userId: string): Promise<Quote[]>;
    addUserHolding(userId: string, ticker: string, shares: number, purchaseDate: Date , purchasePrice?: number): Promise<void>;
    removeUserHolding(userId: string, ticker: string): Promise<void>;
    getPortfolioOverview(userId: string): Promise<PortfolioOverview>;

    // return chart for each resolution in chart period
    getPortfolioCharts(userId: string): Promise<Record<string, Record<ChartPeriod, Candle[]>>>;
}