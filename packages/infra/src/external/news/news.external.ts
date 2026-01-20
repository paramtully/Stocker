import NewsSummary from "@stocker/domain/news/newsSummary";
import NewsArticle from "packages/domain/src/news/newsArticle";
import NewsHistoryStatus from "packages/domain/src/news/newsHistoryStatus";
import LlmExternalService from "./llm.external";
import LlmOpenAI from "./llm.openai";

export default abstract class NewsExternalService {
    private readonly llmExternalService: LlmExternalService;
    constructor() {
        this.llmExternalService = new LlmOpenAI(process.env.OPENAI_API_KEY!);
    }

    abstract getAllLatestNewsArticles(tickers: string[], latestArticleDate: Date): Promise<Record<string, NewsArticle[]>>;
    abstract getAllHistoricalNewsArticles(tickers: string[]): Promise<Record<string, NewsArticle[]>>;
    
    // TODO: decouple from llm service (instead return prompt and let the caller generate the summary)
    getNewsSummaries(newsArticles: NewsArticle[]): Promise<Record<string, NewsSummary[]>> {
        for (const newsArticle of newsArticles) {
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
    
            return newsSummaries;
        }
    }

}