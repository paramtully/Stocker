import { NewsSummary } from "server/src/domain/news";
import { Holding } from "server/src/domain/portfolio";
import { NewsDrizzleRepository } from "server/src/repositories/drizzle/news";
import { HoldingsDrizzleRepository } from "server/src/repositories/drizzle/portfolio";
import { NewsRepository } from "server/src/repositories/interfaces/news";
import { HoldingsRepository } from "server/src/repositories/interfaces/portfolio";
import INewsService from "./INews.service";

export default class NewsService implements INewsService {
    private readonly newsRepository: NewsRepository;
    private readonly holdingsRepository: HoldingsRepository;

    constructor() {
        this.newsRepository = new NewsDrizzleRepository();
        this.holdingsRepository = new HoldingsDrizzleRepository();
    }

    async getNewsArticles(userId: string): Promise<NewsSummary[]> {
        const userHoldings = await this.holdingsRepository.getHoldingsByUserId(userId);
        const tickers = userHoldings.map((holding: Holding) => holding.ticker);
        const newsSummaries: Record<string, NewsSummary[]> = await this.newsRepository.getNewsSummariesByTickers(tickers);
        return Object.values(newsSummaries).flat().sort((a: NewsSummary, b: NewsSummary) => b.publishDate.getTime() - a.publishDate.getTime()).slice(0, 50);
    }
}