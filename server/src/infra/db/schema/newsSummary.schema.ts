import { pgTable, varchar, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { stocks } from "./stocks.schema";
import { primaryKey } from "drizzle-orm/pg-core";

export const newsSummaries = pgTable("news_summaries", {
    ticker: varchar("ticker").notNull().references(() => stocks.ticker),
    source: text("source").notNull(),
    headline: text("headline").notNull(),
    articleUrl: text("article_url").notNull(),
    publishDate: date("publish_date").notNull(),
    summary: text("summary"),
    impactAnalysis: text("impact_analysis"),
    recommendedActions: text("recommended_actions"),
    sentiment: text("sentiment"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.ticker, table.publishDate, table.source] }),
]);

export const insertNewsSummarySchema = createInsertSchema(newsSummaries).omit({
    id: true,
    fetchedAt: true,
});
  
export type DbInsertNewsSummary = z.infer<typeof insertNewsSummarySchema>;
export type DbNewsSummary = typeof newsSummaries.$inferSelect;