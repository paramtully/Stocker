import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Analytics: Daily aggregated metrics
export const dailyMetrics = pgTable("daily_metrics", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    date: timestamp("date").notNull(),
    totalVisits: integer("total_visits").default(0),
    uniqueVisitors: integer("unique_visitors").default(0),
    signups: integer("signups").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics).omit({
id: true,
createdAt: true,
});

export type DbInsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;
export type DbDailyMetrics = typeof dailyMetrics.$inferSelect;