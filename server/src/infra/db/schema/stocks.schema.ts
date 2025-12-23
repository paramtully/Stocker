import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stocks = pgTable("stocks", {
    ticker: text("ticker").primaryKey(),
    companyName: text("company_name").notNull(),
    cik: text("cik").notNull(),
    isin: text("isin").notNull(),
    cusip: text("cusip").notNull(),
    marketCap: numeric("market_cap").notNull(),
    industry: text("industry").notNull(),
    exchange: text("exchange").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocks);

export type DbInsertStock = z.infer<typeof insertStockSchema>;
export type DbStock = typeof stocks.$inferSelect;