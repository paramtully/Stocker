import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod"
import { check } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    cognitoSub: varchar("cognito_sub").unique(),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    emailEnabled: boolean("email_enabled").default(true),
    emailDeliveryHour: integer("email_delivery_hour").default(8),
    isGuest: boolean("is_guest").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
    check("email_not_empty", sql`${table.email} IS NOT NULL AND ${table.email} != ''`),
    check("email_valid", sql`${table.email} IS NOT NULL AND ${table.email} LIKE '%@%' AND ${table.email} NOT LIKE '%@%@%'`),
    check("email_unique", sql`${table.email} IS UNIQUE`),
    check("email_delivery_hour_valid", sql`${table.emailDeliveryHour} >= 0 AND ${table.emailDeliveryHour} <= 23`),
    check("created_at_not_in_future", sql`${table.createdAt} <= CURRENT_TIMESTAMP`),
    check("updated_at_not_in_future", sql`${table.updatedAt} <= CURRENT_TIMESTAMP`),
]);

export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type DbUser = typeof users.$inferSelect;
export type DbInsertUser = z.infer<typeof insertUserSchema>;

export const updateUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type DbUpdateUser = z.infer<typeof updateUserSchema>;