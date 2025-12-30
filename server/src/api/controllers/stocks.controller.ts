import { Request, Response } from "express";
import StockService from "server/src/services/stock/stock.service";

export const stocksController = {
    searchStocksByPrefix: async (req: Request, res: Response) => {
        try {
            const prefix = (req.query.q as string) || "";
            // const results = tickerDataService.search(query, 10);
            const stockService = new StockService();
            const results = await stockService.searchTickersByPrefix(prefix);
            res.json(results);
          } catch (error) {
            console.error("Error searching tickers:", error);
            res.status(500).json({ error: "Failed to search tickers" });
          }
    },
}