import { pgTable, text, numeric, date } from "drizzle-orm/pg-core";
import { stocks } from "./stocks.schema";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { check } from "drizzle-orm/pg-core";

export const candles = pgTable("candles", {
    ticker: text("ticker").notNull().references(() => stocks.ticker, { onDelete: "cascade" }),
    open: numeric("open", { precision: 10, scale: 2 }).notNull(),
    high: numeric("high", { precision: 10, scale: 2 }).notNull(),
    low: numeric("low", { precision: 10, scale: 2 }).notNull(),
    close: numeric("close", { precision: 10, scale: 2 }).notNull(),
    volume: numeric("volume", { precision: 10, scale: 2 }).notNull(),
    date: date("date").notNull(),
}, (table) => [
    primaryKey({ columns: [table.ticker, table.date] }),
    check("open_positive", sql`${table.open} >= 0`),
    check("high_positive", sql`${table.high} >= 0`),
    check("low_positive", sql`${table.low} >= 0`),
    check("close_positive", sql`${table.close} >= 0`),
    check("volume_positive", sql`${table.volume} >= 0`),
    check("date_not_in_future", sql`${table.date} <= CURRENT_DATE`),
]);

// Zod validation - for better API error messages
export const insertCandleSchema = createInsertSchema(candles).extend({
    open: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Open must be greater than or equal to 0" }),
    high: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "High must be greater than or equal to 0" }),
    low: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Low must be greater than or equal to 0" }),
    close: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Close must be greater than or equal to 0" }),
    volume: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Volume must be greater than or equal to 0" }),
    date: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, { message: "Date must be in the past" }),
});

export type DbInsertCandle = z.infer<typeof insertCandleSchema>;
export type DbCandle = typeof candles.$inferSelect;