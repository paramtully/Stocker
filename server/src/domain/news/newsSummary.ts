export default interface NewsSummary {
    ticker: string;
    source: string;
    headline: string;
    articleUrl: string;
    publishDate: Date;
    summary: string;
    impactAnalysis: string[];
    recommendedActions: string[];
    sentiment: "positive" | "negative" | "neutral";
}