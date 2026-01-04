import { Request, Response } from "express";
import { mockQuotes } from "server/src/infra/mocks/quote.mock";
import PortfolioService from "server/src/services/portfolio/portfolio.service";
import IPortfolioService from "server/src/services/portfolio/IPortfolio.service";
import getUserId from "../shared/getUser";

const portfolioService: IPortfolioService = new PortfolioService();

export const portfolioController = {

    getUserQuotes: async (req: Request, res: Response) => {
        try {
            
            const userId: string | undefined = getUserId(req);
            const userQuotes = userId ? await portfolioService.getUserQuotes(userId) : [];
            
            // If user has no holdings, return mock quotes as defaults with default shares
            if (userQuotes.length === 0) {
              return res.json(mockQuotes);
            }
      
            // Fetch current prices for user's stocks
            return res.json(userQuotes);
          } catch (error) {
            console.error("Error fetching quotes:", error);
            res.status(500).json({ error: "Failed to fetch quotes" });
          }
    },

    addUserHolding: async (req: Request, res: Response) => {
        try {
            const userId: string | undefined = getUserId(req);

            const { ticker, shares, purchaseDate, purchasePrice } = req.body;
            if (!ticker || !shares || !purchaseDate) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            await portfolioService.addUserHolding(userId!, ticker, shares, purchaseDate, purchasePrice);
            return res.status(200).json({ message: "Holding added successfully" });
        } catch (error) {
            console.error("Error adding stock to portfolio:", error);
            res.status(500).json({ error: "Failed to add stock to portfolio" });
        }
    },

    removeUserHolding: async (req: Request, res: Response) => {
        try {
            const userId: string | undefined = getUserId(req);

            const { ticker } = req.params;
            if (!ticker) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            await portfolioService.removeUserHolding(userId!, ticker);
            return res.status(200).json({ message: "Holding removed successfully" });
        } catch (error) {
            console.error("Error removing stock from portfolio:", error);
            res.status(500).json({ error: "Failed to remove stock from portfolio" });
        }
    },

    getPortfolioOverview: async (req: Request, res: Response) => {
        try {
            const userId: string | undefined = getUserId(req);

            const portfolioOverview = userId ? await portfolioService.getPortfolioOverview(userId) : null;
            return res.json(portfolioOverview);
        } catch (error) {
            console.error("Error getting portfolio overview:", error);
            return res.status(500).json({ error: "Failed to get portfolio overview" });
        }
    },

    getPortfolioCharts: async (req: Request, res: Response) => {
        try {
            const userId: string | undefined = getUserId(req);

            const portfolioCharts = userId ? await portfolioService.getPortfolioCharts(userId) : {};
            return res.json(portfolioCharts);
        } catch (error) {
            console.error("Error getting portfolio charts:", error);
            return res.status(500).json({ error: "Failed to get portfolio charts" });
        }
    },
}