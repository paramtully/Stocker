import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    cognitoSub: varchar("cognito_sub").unique(),
    email: varchar("email"),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    emailEnabled: boolean("email_enabled").default(true),
    emailDeliveryHour: integer("email_delivery_hour").default(8),
    isGuest: boolean("is_guest").default(false),
    isAdmin: boolean("is_admin").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

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