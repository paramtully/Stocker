import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const newsArticles = pgTable("news_articles", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticker: text("ticker").notNull(),
    source: text("source").notNull(),
    headline: text("headline").notNull(),
    articleUrl: text("article_url").notNull(),
    publishedAt: timestamp("published_at").notNull(),
    summary: text("summary"),
    impactAnalysis: text("impact_analysis"),
    recommendedActions: text("recommended_actions"),
    sentiment: text("sentiment"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
    id: true,
    fetchedAt: true,
});
  
export type DbInsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type DbNewsArticle = typeof newsArticles.$inferSelect;