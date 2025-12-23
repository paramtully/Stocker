import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { stocks } from "./stocks.schema";

export const newsSummaries = pgTable("news_summaries", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticker: varchar("ticker").notNull().references(() => stocks.ticker),
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
export const insertNewsSummarySchema = createInsertSchema(newsSummaries).omit({
    id: true,
    fetchedAt: true,
});
  
export type DbInsertNewsSummary = z.infer<typeof insertNewsSummarySchema>;
export type DbNewsSummary = typeof newsSummaries.$inferSelect;