import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stocks = pgTable("stocks", {
    ticker: text("ticker").primaryKey(),
    companyName: text("company_name").notNull(),
    dayChangePercent: text("change_percent").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const insertStockSchema = createInsertSchema(stocks);

export type DbInsertStock = z.infer<typeof insertStockSchema>;
export type DbStock = typeof stocks.$inferSelect;