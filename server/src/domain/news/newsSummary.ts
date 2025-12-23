export default interface NewsSummary {
    ticker: string;
    source: string;
    headline: string;
    articleUrl: string;
    publishedAt: Date;
    summary: string;
    impactAnalysis: string[];
    recommendedActions: string[];
    sentiment: "positive" | "negative" | "neutral";
}