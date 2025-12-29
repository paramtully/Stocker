import { users } from "./users.schema";
import { stocks } from "./stocks.schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable, varchar, integer, timestamp, primaryKey, date, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { check } from "drizzle-orm/pg-core";

export const holdings = pgTable("holdings", {
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ticker: varchar("ticker").notNull().references(() => stocks.ticker, { onDelete: "cascade" }),
    shares: integer("shares").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
    purchaseDate: date("purchase_date").notNull(),
    addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.userId, table.ticker] }),
    check("purchase_price_positive", sql`${table.purchasePrice} >= 0`),
    check("shares_positive", sql`${table.shares} > 0`),
    check("purchase_date_not_in_future", sql`${table.purchaseDate} <= CURRENT_DATE`),
]);

// Zod validation - for better API error messages
export const insertHoldingSchema = createInsertSchema(holdings).extend({
    purchasePrice: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Purchase price must be greater than or equal to 0" }),
    shares: z.string().refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
    }, { message: "Shares must be greater than 0" }),
    purchaseDate: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, { message: "Purchase date must be in the past" }),
});

export type DbInsertHolding = z.infer<typeof insertHoldingSchema>;
export type DbHolding = typeof holdings.$inferSelect;