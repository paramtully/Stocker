import { Request, Response } from "express";
import { mockQuotes } from "server/src/infra/mocks/quote.mock";
import Quote from "server/src/domain/stock/quote";
import PortfolioService from "server/src/services/portfolio/portfolio.service";
import IPortfolioService from "server/src/services/portfolio/IPortfolio.service";

function getUserId(req: Request): string | null {
    // Check for authenticated user
    const user = req.user as any;
    if (user?.claims?.sub) {
      return user.claims.sub;
    }
    
    // Check for guest session
    const session = req.session as any;
    if (session?.guestUserId) {
      return session.guestUserId;
    }
    
    return null;
}

const portfolioService: IPortfolioService = new PortfolioService();

export const portfolioController = {
    getUserHoldings: async (req: Request, res: Response) => {
        try {
            
            const userId: string | null = getUserId(req);
            if (!userId) {
              return res.status(401).json({ error: "No session" });
            }
      
            const userHoldings = await portfolioService.getUserHoldings(userId);
            
            // If user has no holdings, return mock quotes as defaults with default shares
            if (userHoldings.length === 0) {
              const quotes: Quote[] = mockQuotes;
              return res.json(quotes);
            }
      
            // Fetch current prices for user's stocks
            const quotes: Quote[] = await portfolioService.getUserQuotes(userId);
            
            res.json(quotes);
          } catch (error) {
            console.error("Error fetching quotes:", error);
            res.status(500).json({ error: "Failed to fetch quotes" });
          }
        }
    },
    getUserQuotes: async (req: Request, res: Response) => {
        try {
            const userId: string | null = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "No session" });
            }
        }
    }
}