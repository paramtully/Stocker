import { NewsArticle, type NewsSummary } from "packages/domain/src/news";

export default interface NewsService {
    getNewsSummaries(userId: string): Promise<NewsSummary[]>;
    getNewsSummariesPage(userId: string, limit: number, offset: number, ticker?: string): Promise<{ articles: NewsSummary[]; total: number }>;
    addNewsSummary(newsArticles: NewsArticle[]): Promise<void>;
    summarizeUserNews(userId: string): Promise<string>;
}