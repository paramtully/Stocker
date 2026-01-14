import { pgTable, varchar, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { stocks } from "./stocks.schema";

export const newsSummaries = pgTable("news_summaries", {
    articleUrl: text("article_url").primaryKey(),
    ticker: varchar("ticker").notNull().references(() => stocks.ticker),
    source: text("source").notNull(),
    headline: text("headline").notNull(),
    publishDate: date("publish_date").notNull(),
    summary: text("summary"),
    impactAnalysis: text("impact_analysis"),
    recommendedActions: text("recommended_actions"),
    sentiment: text("sentiment"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const insertNewsSummarySchema = createInsertSchema(newsSummaries).omit({
    fetchedAt: true,
});
  
export type DbInsertNewsSummary = z.infer<typeof insertNewsSummarySchema>;
export type DbNewsSummary = typeof newsSummaries.$inferSelect;