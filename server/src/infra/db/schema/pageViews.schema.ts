import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Analytics: Page views tracking
export const pageViews = pgTable("page_views", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    path: text("path").notNull(),
    userId: varchar("user_id"),
    sessionId: varchar("session_id"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at").defaultNow(),
});
  
export const insertPageViewSchema = createInsertSchema(pageViews).omit({
    id: true,
    occurredAt: true,
});

export type DbInsertPageView = z.infer<typeof insertPageViewSchema>;
export type DbPageView = typeof pageViews.$inferSelect;