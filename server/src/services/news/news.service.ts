import { NewsArticle, NewsSummary } from "server/src/domain/news";
import { Holding } from "server/src/domain/portfolio";
import { NewsDrizzleRepository } from "server/src/repositories/drizzle/news";
import { HoldingsDrizzleRepository } from "server/src/repositories/drizzle/portfolio";
import { NewsRepository } from "server/src/repositories/interfaces/news";
import { HoldingsRepository } from "server/src/repositories/interfaces/portfolio";
import INewsService from "./INews.service";
import LlmExternalService from "server/src/infra/external/llm/llm.external";
import LlmOpenAI from "server/src/infra/external/llm/llm.openAI";
import { PortfolioService, IPortfolioService } from "../portfolio/";
import Quote from "server/src/domain/stock/quote";

export default class NewsService implements INewsService {
    private readonly newsRepository: NewsRepository;
    private readonly holdingsRepository: HoldingsRepository;
    private readonly llmExternalService: LlmExternalService;
    private readonly portfolioService: IPortfolioService;
    
    constructor() {
        this.newsRepository = new NewsDrizzleRepository();
        this.holdingsRepository = new HoldingsDrizzleRepository();
        this.portfolioService = new PortfolioService();
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
            const summary = await this.llmExternalService.generateJsonString(systemPrompt, userPrompt);
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

    async summarizeUserNews(userId: string): Promise<string> {
        const userHoldings = await this.holdingsRepository.getUserHoldings(userId);
        const quotes: Quote[] = await this.portfolioService.getUserQuotes(userId);
        const tickers = userHoldings.map((holding: Holding) => holding.ticker);
        const newsSummaries: Record<string, NewsSummary[]> = await this.newsRepository.getTodaysNewsSummariesByTickers(tickers);
        const flattenedNewsSummaries: NewsSummary[] = Object.values(newsSummaries).flat();

        const systemPrompt: string = `You are a financial analyst writing a daily email summary for an investor. 
Write a concise, professional email that summarizes:
1. Portfolio overview with key movers
2. Important news highlights
3. Key takeaways and things to watch

Keep it under 500 words. Use a friendly but professional tone.

Respond in JSON format:
{
"dailyEmailSummary": "string",
}`
        const userPrompt: string = `Generate a daily email summary for this portfolio:
Portfolio:
${quotes.map(q => `- ${q.ticker} (${q.companyName}): $${q.price.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%)`).join('\n')}

Recent News:
${flattenedNewsSummaries.map(n => `- [${n.ticker}] ${n.headline} (${n.sentiment})`).join('\n')}`

        const summary = await this.llmExternalService.generateJsonString(systemPrompt, userPrompt);
        return JSON.parse(summary).dailyEmailSummary as string || '';
    }
}