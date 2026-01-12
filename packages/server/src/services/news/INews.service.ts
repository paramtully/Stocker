import { NewsArticle, type NewsSummary } from "packages/domain/src/news";

export default interface NewsService {
    getNewsSummaries(userId: string): Promise<NewsSummary[]>;
    addNewsSummary(newsArticles: NewsArticle[]): Promise<void>;
    summarizeUserNews(userId: string): Promise<string>;
}