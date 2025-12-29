import { type NewsSummary } from "server/src/domain/news";

export default interface NewsService {
    getNewsArticles(userId: string): Promise<NewsSummary[]>;
}