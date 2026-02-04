import { Request, Response } from "express";
import IStockService from "server/src/services/stock/IStock.service";
import StockService from "server/src/services/stock/stock.service";

const stockService: IStockService = new StockService();

export const stocksController = {
    searchStocksByPrefix: async (req: Request, res: Response) => {
        try {
            const prefix = (req.query.q as string) || "";
            const results: string[] = await stockService.searchTickersByPrefix(prefix);
            return res.json(results);
          } catch (error) {
            console.error("Error searching tickers:", error);
            return res.status(500).json({ error: "Failed to search tickers" });
          }
    },
}