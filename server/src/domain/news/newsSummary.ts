export default interface NewsSummary {
    ticker: string;
    articles: {
        id: string;
        source: string;
        publishedAt: string;
        headline: string;
        summary: string;
        impactAnalysis: string[];
        recommendedActions: string[];
        articleUrl: string;
        sentiment: "positive" | "negative" | "neutral";
    }[];
}