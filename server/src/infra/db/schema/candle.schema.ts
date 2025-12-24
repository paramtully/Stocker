import { pgTable, text, numeric, date } from "drizzle-orm/pg-core";
import { stocks } from "./stocks.schema";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candles = pgTable("candles", {
    ticker: text("ticker").notNull().references(() => stocks.ticker, { onDelete: "cascade" }),
    open: numeric("open").notNull(),
    high: numeric("high").notNull(),
    low: numeric("low").notNull(),
    close: numeric("close").notNull(),
    volume: numeric("volume").notNull(),
    date: date("date").notNull(),
}, (table) => [
    primaryKey({ columns: [table.ticker, table.date] })
]);

export const insertCandleSchema = createInsertSchema(candles);

export type DbInsertCandle = z.infer<typeof insertCandleSchema>;
export type DbCandle = typeof candles.$inferSelect;