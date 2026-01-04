import { Request, Response } from "express";
import INewsService from "server/src/services/news/INews.service";
import NewsService from "server/src/services/news/news.service";
import getUserId from "../shared/getUser";

const newsService: INewsService = new NewsService();

export const newsController = {
    getUserNews: async (req: Request, res: Response) => {
        try {

            const userId: string | undefined = getUserId(req);
            const userNews = userId ? await newsService.getNewsSummaries(userId) : [];
            return res.json(userNews);
        } catch (error) {
            console.error("Error getting user news:", error);
            return res.status(500).json({ error: "Failed to get user news" });
        }
    },
    
}