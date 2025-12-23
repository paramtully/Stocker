import NewsRepository from "../interfaces/news.repository";
import { NewsSummary, Sentiment } from "server/src/domain/news";
import { DbInsertNewsSummary, DbNewsSummary } from "server/src/infra/db/schema/newsSummary.schema";
import { db } from "server/src/infra/db/db";
import { eq, desc, inArray, asc } from "drizzle-orm";
import { newsSummaries } from "server/src/infra/db/schema/newsSummary.schema";

export default class NewsDrizzleRepository implements NewsRepository {
    async getNewsSummaries(ticker: string): Promise<NewsSummary[]> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker)).orderBy(desc(newsSummaries.publishedAt)).limit(200);
        return dbNewsSummaries.map(this.toDomainNewsSummary);
    }

    async getLatestNewsSummary(ticker: string): Promise<NewsSummary | null> {
        const [dbNewsSummary] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker)).orderBy(desc(newsSummaries.publishedAt)).limit(1);
        return dbNewsSummary ? this.toDomainNewsSummary(dbNewsSummary as DbNewsSummary) : null;
    }

    async getTickerNewsSummaries(ticker: string): Promise<NewsSummary[]> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker));
        return dbNewsSummaries.map(this.toDomainNewsSummary);
    }

    async getNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(inArray(newsSummaries.ticker, tickers));
        return dbNewsSummaries.reduce((acc, dbNewsSummary) => {
            acc[dbNewsSummary.ticker] = [...(acc[dbNewsSummary.ticker] || []), this.toDomainNewsSummary(dbNewsSummary)];
            return acc;
        }, {} as Record<string, NewsSummary[]>);
    }

    async insertNewsSummary(newsSummary: DbInsertNewsSummary): Promise<NewsSummary> {
        const [dbNewsSummary] = await db.insert(newsSummaries).values(newsSummary).returning();
        return this.toDomainNewsSummary(dbNewsSummary as DbInsertNewsSummary);
    }

    async getEarliestArticleDate(tickers: string[]): Promise<Record<string, Date>> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(inArray(newsSummaries.ticker, tickers)).orderBy(asc(newsSummaries.publishedAt)).limit(1);
        return dbNewsSummaries.reduce((acc, dbNewsSummary) => {
            acc[dbNewsSummary.ticker] = dbNewsSummary.publishedAt;
            return acc;
        }, {} as Record<string, Date>);
    }

    toDomainNewsSummary(dbNewsSummary: DbInsertNewsSummary): NewsSummary {
        return {
            ticker: dbNewsSummary.ticker,
            source: dbNewsSummary.source,
            headline: dbNewsSummary.headline,
            articleUrl: dbNewsSummary.articleUrl,
            publishedAt: new Date(dbNewsSummary.publishedAt),
            summary: dbNewsSummary.summary ?? "",
            impactAnalysis: dbNewsSummary.impactAnalysis ? dbNewsSummary.impactAnalysis.split(",") : [],
            recommendedActions: dbNewsSummary.recommendedActions ? dbNewsSummary.recommendedActions.split(",") : [],
            sentiment: dbNewsSummary.sentiment as Sentiment | undefined ?? "neutral" as Sentiment,
        };
    }

    toDbInsertNewsSummary(newsSummary: NewsSummary): DbInsertNewsSummary {
        return {
            ticker: newsSummary.ticker,
            source: newsSummary.source,
            headline: newsSummary.headline,
            articleUrl: newsSummary.articleUrl,
            publishedAt: newsSummary.publishedAt,
            summary: newsSummary.summary,
            impactAnalysis: newsSummary.impactAnalysis.join(","),
            recommendedActions: newsSummary.recommendedActions.join(","),
            sentiment: newsSummary.sentiment,
        };
    }
}