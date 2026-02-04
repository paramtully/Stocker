import { pgTable, varchar, boolean } from "drizzle-orm/pg-core";
import { stocks } from "./stocks.schema";

export const newsHistoryStatuses = pgTable("news_history_status", {
    ticker: varchar("ticker").primaryKey().notNull().references(() => stocks.ticker, { onDelete: "cascade" }),
    isHistoryComplete: boolean("is_history_complete").notNull().default(false),
});

export type DbNewsHistoryStatus = typeof newsHistoryStatuses.$inferSelect;