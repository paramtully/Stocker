import { users } from "./users.schema";
import { stocks } from "./stocks.schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable, varchar, integer, text, timestamp, primaryKey, date } from "drizzle-orm/pg-core";

export const holdings = pgTable("holdings", {
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ticker: varchar("ticker").notNull().references(() => stocks.ticker, { onDelete: "cascade" }),
    shares: integer("shares").notNull(),
    purchasePrice: text("purchase_price").notNull(),
    purchaseDate: date("purchase_date").notNull(),
    addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.userId, table.ticker] })
]);

export const insertHoldingSchema = createInsertSchema(holdings);

export type DbInsertHolding = z.infer<typeof insertHoldingSchema>;
export type DbHolding = typeof holdings.$inferSelect;