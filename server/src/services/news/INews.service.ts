import { NewsArticle, type NewsSummary } from "server/src/domain/news";

export default interface NewsService {
    getNewsSummaries(userId: string): Promise<NewsSummary[]>;
    addNewsSummary(newsArticles: NewsArticle[]): Promise<void>;
    summarizeUserNews(userId: string): Promise<string>;
}