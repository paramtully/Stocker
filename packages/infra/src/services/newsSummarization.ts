import { LLMFallbackService } from "@stocker/infra/external/llm";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";

interface TokenLimits {
    maxTokens: number;  // Max tokens per request (varies by LLM)
    maxInputTokens: number;  // Max input tokens (usually maxTokens - response tokens)
}

interface BatchResult {
    summaries: NewsSummary[];
    failedArticles: NewsArticle[];
}

/**
 * Service for converting news articles to summaries using LLM
 * Handles batching, token limits, and LLM fallback
 */
export default class NewsSummarizationService {
    private llmService: LLMFallbackService;
    private tokenLimits: TokenLimits;

    constructor(tokenLimits?: TokenLimits) {
        this.llmService = new LLMFallbackService();
        // Default token limits for GPT-4o (can be overridden)
        this.tokenLimits = tokenLimits || {
            maxTokens: 128000,  // GPT-4o max
            maxInputTokens: 127000,  // Leave room for response
        };
    }

    /**
     * Summarize articles in batches based on token limits
     */
    async summarizeArticles(articles: NewsArticle[]): Promise<BatchResult> {
        if (articles.length === 0) {
            return { summaries: [], failedArticles: [] };
        }

        // Batch articles by token limits
        const batches = this.batchArticles(articles);
        console.log(`Processing ${articles.length} articles in ${batches.length} batch(es)`);

        const allSummaries: NewsSummary[] = [];
        const failedArticles: NewsArticle[] = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} articles)...`);

            try {
                const batchResult = await this.processBatch(batch);
                allSummaries.push(...batchResult.summaries);
                failedArticles.push(...batchResult.failedArticles);
            } catch (error) {
                console.error(`Batch ${i + 1} failed completely:`, error);
                // Mark all articles in batch as failed
                failedArticles.push(...batch);
            }
        }

        return {
            summaries: allSummaries,
            failedArticles,
        };
    }

    /**
     * Process a single batch of articles
     */
    private async processBatch(articles: NewsArticle[]): Promise<BatchResult> {
        const { systemPrompt, userPrompt } = this.createBatchPrompt(articles);

        try {
            const response = await this.llmService.generateJsonString(systemPrompt, userPrompt);
            
            if (!response || response.trim().length === 0) {
                throw new Error("Empty response from LLM");
            }

            // Parse JSON response
            const parsed = JSON.parse(response);
            
            if (!Array.isArray(parsed)) {
                throw new Error("LLM response is not an array");
            }

            // Map LLM responses to NewsSummary objects
            const summaries: NewsSummary[] = [];
            const processedUrls = new Set<string>();

            for (const item of parsed) {
                if (!item.articleUrl) {
                    console.warn("LLM response missing articleUrl, skipping");
                    continue;
                }

                // Find corresponding article
                const article = articles.find(a => a.url === item.articleUrl);
                if (!article) {
                    console.warn(`Article not found for URL: ${item.articleUrl}`);
                    continue;
                }

                // Validate response structure
                if (!item.summary || !Array.isArray(item.impactAnalysis) || 
                    !Array.isArray(item.recommendedActions) || !item.sentiment) {
                    console.warn(`Invalid LLM response structure for ${item.articleUrl}`);
                    continue;
                }

                summaries.push({
                    ticker: article.ticker,
                    source: article.source,
                    headline: article.title,
                    articleUrl: article.url,
                    publishDate: article.publishDate,
                    summary: item.summary,
                    impactAnalysis: item.impactAnalysis,
                    recommendedActions: item.recommendedActions,
                    sentiment: item.sentiment as "positive" | "negative" | "neutral",
                });

                processedUrls.add(article.url);
            }

            // Find articles that weren't processed
            const failedArticles = articles.filter(a => !processedUrls.has(a.url));

            return {
                summaries,
                failedArticles,
            };
        } catch (error) {
            console.error("Error processing batch:", error);
            // Return all articles as failed
            return {
                summaries: [],
                failedArticles: articles,
            };
        }
    }

    /**
     * Batch articles based on token limits
     */
    private batchArticles(articles: NewsArticle[]): NewsArticle[][] {
        const batches: NewsArticle[][] = [];
        let currentBatch: NewsArticle[] = [];
        let currentTokens = 200; // System prompt tokens (estimated)

        for (const article of articles) {
            const articleTokens = this.estimateArticleTokens(article);
            const responseTokens = 500; // Estimated per article response tokens
            const totalTokens = articleTokens + responseTokens;

            if (currentTokens + totalTokens > this.tokenLimits.maxInputTokens) {
                // Start new batch
                if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                }
                currentBatch = [article];
                currentTokens = 200 + articleTokens; // System prompt + article
            } else {
                currentBatch.push(article);
                currentTokens += totalTokens;
            }
        }

        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }

    /**
     * Estimate tokens for an article
     */
    private estimateArticleTokens(article: NewsArticle): number {
        const text = `${article.ticker} ${article.title} ${article.summary}`;
        return this.estimateTokens(text);
    }

    /**
     * Simple token estimation: ~4 characters per token
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Create batch prompt for multiple articles
     */
    private createBatchPrompt(articles: NewsArticle[]): { systemPrompt: string; userPrompt: string } {
        const systemPrompt = `You are a financial analyst assistant. Analyze news articles about stocks and provide for EACH article:
1. A concise AI summary (2-3 sentences)
2. Impact analysis (3 bullet points about how this affects the stock)
3. Recommended actions (3 bullet points for investors)
4. Overall sentiment (positive, negative, or neutral)

Respond in JSON format with an array:
[
  {
    "articleUrl": "string",
    "summary": "string",
    "impactAnalysis": ["string", "string", "string"],
    "recommendedActions": ["string", "string", "string"],
    "sentiment": "positive" | "negative" | "neutral"
  },
  ...
]

IMPORTANT: Return exactly one object per article in the same order as provided.`;

        const userPrompt = `Analyze these ${articles.length} news articles:
${articles.map((a, index) => `
Article ${index + 1}:
- Ticker: ${a.ticker}
- Headline: ${a.title}
- Summary: ${a.summary}
- URL: ${a.url}
`).join('\n')}`;

        return { systemPrompt, userPrompt };
    }

    /**
     * Get error log from LLM service
     */
    getErrorLog() {
        return this.llmService.getErrorLog();
    }
}

