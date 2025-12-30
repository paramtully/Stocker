import { Request, Response } from "express";
import INewsService from "server/src/services/news/INews.service";
import NewsService from "server/src/services/news/news.service";

const newsService: INewsService = new NewsService();

export const newsController = {
    getUserNews: async (req: Request, res: Response) => {
        try {

            const userId: string | null = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "No session" });
            }

            const userNews = await newsService.getNewsSummaries(userId);
            return res.status(200).json(userNews);
        } catch (error) {
            console.error("Error getting user news:", error);
            res.status(500).json({ error: "Failed to get user news" });
        }
    },
}