import { NewsArticle } from "server/src/domain/news";

export default interface NewsService {
    getNews(ticker: string): Promise<NewsArticle[]>;
}