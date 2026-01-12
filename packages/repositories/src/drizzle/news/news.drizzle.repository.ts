import { NewsSummary, Sentiment } from "packages/domain/src/news";
import { DbInsertNewsSummary, DbNewsSummary } from "../../../../db/src/schema/newsSummary.schema";
import { db } from "../../../../db/src/db";
import { eq, desc, inArray, asc, and } from "drizzle-orm";
import { newsSummaries } from "../../../../db/src/schema/newsSummary.schema";
import NewsRepository from "../../interfaces/news/news.repository";

export default class NewsDrizzleRepository implements NewsRepository {
    async getNewsSummaries(ticker: string): Promise<NewsSummary[]> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker)).orderBy(desc(newsSummaries.publishDate));
        return dbNewsSummaries.map(this.toDomainNewsSummary);
    }

    async getLatestNewsSummary(ticker: string): Promise<NewsSummary | null> {
        const [dbNewsSummary] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker)).orderBy(desc(newsSummaries.publishDate)).limit(1);
        return dbNewsSummary ? this.toDomainNewsSummary(dbNewsSummary as DbNewsSummary) : null;
    }

    async getTickerNewsSummaries(ticker: string): Promise<NewsSummary[]> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(eq(newsSummaries.ticker, ticker));
        return dbNewsSummaries.map(this.toDomainNewsSummary);
    }

    async getNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(inArray(newsSummaries.ticker, tickers)).limit(50);
        return dbNewsSummaries.reduce((acc, dbNewsSummary) => {
            acc[dbNewsSummary.ticker] = [...(acc[dbNewsSummary.ticker] || []), this.toDomainNewsSummary(dbNewsSummary)];
            return acc;
        }, {} as Record<string, NewsSummary[]>);
    }

    async getTodaysNewsSummariesByTickers(tickers: string[]): Promise<Record<string, NewsSummary[]>> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select()
        .from(newsSummaries)
        .where(and(
            inArray(newsSummaries.ticker, tickers), 
            eq(newsSummaries.publishDate, new Date().toISOString().split("T")[0])));
        return dbNewsSummaries.reduce((acc, dbNewsSummary) => {
            acc[dbNewsSummary.ticker] = [...(acc[dbNewsSummary.ticker] || []), this.toDomainNewsSummary(dbNewsSummary)];
            return acc;
        }, {} as Record<string, NewsSummary[]>);
    }

    async insertNewsSummary(news: NewsSummary[]): Promise<void> {
        const dbNewsSummaries: DbInsertNewsSummary[] = news.map(this.toDbInsertNewsSummary);
        await db.insert(newsSummaries).values(dbNewsSummaries);
    }

    async getEarliestArticleDate(tickers: string[]): Promise<Record<string, Date>> {
        const dbNewsSummaries: DbNewsSummary[] = await db.select().from(newsSummaries).where(inArray(newsSummaries.ticker, tickers)).orderBy(asc(newsSummaries.publishDate)).limit(1);
        return dbNewsSummaries.reduce((acc, dbNewsSummary) => {
            acc[dbNewsSummary.ticker] = new Date(dbNewsSummary.publishDate);
            return acc;
        }, {} as Record<string, Date>);
    }

    async getDateofLatestNewsSummary(): Promise<Date> {
        const [dbNewsSummary] = await db.select().from(newsSummaries).orderBy(desc(newsSummaries.publishDate)).limit(1);
        return dbNewsSummary ? new Date(dbNewsSummary.publishDate) : new Date(0);
    }

    toDomainNewsSummary(dbNewsSummary: DbInsertNewsSummary): NewsSummary {
        return {
            ticker: dbNewsSummary.ticker,
            source: dbNewsSummary.source,
            headline: dbNewsSummary.headline,
            articleUrl: dbNewsSummary.articleUrl ?? "",
            publishDate: new Date(dbNewsSummary.publishDate),
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
            publishDate: new Date(newsSummary.publishDate).toISOString().split("T")[0], //YYYY-MM-DD
            summary: newsSummary.summary,
            impactAnalysis: newsSummary.impactAnalysis.join(","),
            recommendedActions: newsSummary.recommendedActions.join(","),
            sentiment: newsSummary.sentiment,
        };
    }
}