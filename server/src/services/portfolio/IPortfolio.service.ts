import Holding from "server/src/domain/portfolio/holding";
import Quote from "server/src/domain/stock/quote";
import PortfolioOverview from "server/src/domain/portfolio/portfolioOverview";
import Candle from "server/src/domain/stock/candle";

export default interface IPortfolioService {
    getUserHoldings(userId: string): Promise<Holding[]>;
    getUserQuotes(userId: string): Promise<Quote[]>;
    addUserHolding(holding: Holding): Promise<void>;
    removeUserHolding(userId: string, ticker: string): Promise<void>;
    getPortfolioOverview(userId: string): Promise<PortfolioOverview>;
    getPortfolioCharts(userId: string): Promise<Record<string, Candle[]>>;
}