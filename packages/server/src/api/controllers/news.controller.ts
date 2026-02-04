import { Request, Response } from "express";
import INewsService from "server/src/services/news/INews.service";
import NewsService from "server/src/services/news/news.service";
import getUserId from "../shared/getUser";

const newsService: INewsService = new NewsService();

export const newsController = {
    getUserNews: async (req: Request, res: Response) => {
        try {
            const userId: string | undefined = getUserId(req);
            
            // Parse query parameters
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
            const ticker = req.query.ticker as string | undefined;

            if (userId) {
                const { articles, total } = await newsService.getNewsSummariesPage(userId, limit, offset, ticker);
                const hasMore = offset + articles.length < total;
                return res.json({ articles, total, hasMore });
            } else {
                return res.json({ articles: [], total: 0, hasMore: false });
            }
        } catch (error) {
            console.error("Error getting user news:", error);
            return res.status(500).json({ error: "Failed to get user news" });
        }
    },
    
}