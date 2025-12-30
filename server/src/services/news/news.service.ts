import { NewsArticle, NewsSummary } from "server/src/domain/news";
import { Holding } from "server/src/domain/portfolio";
import { NewsDrizzleRepository } from "server/src/repositories/drizzle/news";
import { HoldingsDrizzleRepository } from "server/src/repositories/drizzle/portfolio";
import { NewsRepository } from "server/src/repositories/interfaces/news";
import { HoldingsRepository } from "server/src/repositories/interfaces/portfolio";
import INewsService from "./INews.service";
import LlmExternalService from "server/src/infra/external/llm/llm.external";
import LlmOpenAI from "server/src/infra/external/llm/llm.openAI";

export default class NewsService implements INewsService {
    private readonly newsRepository: NewsRepository;
    private readonly holdingsRepository: HoldingsRepository;
    private readonly llmExternalService: LlmExternalService;

    constructor() {
        this.newsRepository = new NewsDrizzleRepository();
        this.holdingsRepository = new HoldingsDrizzleRepository();
        this.llmExternalService = new LlmOpenAI(process.env.OPENAI_API_KEY!);
    }

    async getNewsSummaries(userId: string): Promise<NewsSummary[]> {
        const userHoldings = await this.holdingsRepository.getUserHoldings(userId);
        const tickers = userHoldings.map((holding: Holding) => holding.ticker);
        const newsSummaries: Record<string, NewsSummary[]> = await this.newsRepository.getNewsSummariesByTickers(tickers);
        return Object.values(newsSummaries).flat().sort((a: NewsSummary, b: NewsSummary) => b.publishDate.getTime() - a.publishDate.getTime()).slice(0, 50);
    }

    async addNewsSummary(newsArticles: NewsArticle[]): Promise<void> {
        const newsSummaries: NewsSummary[] = await Promise.all(newsArticles.map(async (newsArticle: NewsArticle) => {
            const systemPrompt: string = `You are a financial analyst assistant. Analyze news articles about stocks and provide:
1. A concise AI summary (2-3 sentences)
2. Impact analysis (3 bullet points about how this affects the stock)
3. Recommended actions (3 bullet points for investors)
4. Overall sentiment (positive, negative, or neutral)

Respond in JSON format:
{
"summary": "string",
"impactAnalysis": ["string", "string", "string"],
"recommendedActions": ["string", "string", "string"],
"sentiment": "positive" | "negative" | "neutral"
}` 

            const userPrompt: string = `Analyze this news article about ${newsArticle.ticker}:
            Headline: ${newsArticle.title}
            Summary: ${newsArticle.summary}`;
            const summary = await this.llmExternalService.generateText(systemPrompt, userPrompt);
            const generatedAnalysis = JSON.parse(summary);
            return {
                ticker: newsArticle.ticker,
                source: newsArticle.source,
                headline: newsArticle.title,
                articleUrl: newsArticle.url,
                publishDate: newsArticle.publishDate,
                summary: generatedAnalysis.summary,
                impactAnalysis: generatedAnalysis.impactAnalysis,
                recommendedActions: generatedAnalysis.recommendedActions,
                sentiment: generatedAnalysis.sentiment,
            } as NewsSummary
        }));

        await this.newsRepository.insertNewsSummary(newsSummaries);
    }
}