import { sql } from "drizzle-orm";
import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { check } from "drizzle-orm/pg-core";

export const stocks = pgTable("stocks", {
    ticker: text("ticker").primaryKey(),
    companyName: text("company_name").notNull(),
    // cik: text("cik").notNull(),
    // isin: text("isin").notNull(),
    // cusip: text("cusip").notNull(),
    marketCap: numeric("market_cap", { precision: 10, scale: 2 }).notNull(),
    industry: text("industry").notNull(),
    exchange: text("exchange").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
    check("market_cap_positive", sql`${table.marketCap} >= 0`),
    check("updated_at_not_in_future", sql`${table.updatedAt} <= CURRENT_TIMESTAMP`),
]);

// Zod validation - for better API error messages
export const insertStockSchema = createInsertSchema(stocks).extend({
    marketCap: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Market cap must be greater than or equal to 0" }),
});

export type DbInsertStock = z.infer<typeof insertStockSchema>;
export type DbStock = typeof stocks.$inferSelect;