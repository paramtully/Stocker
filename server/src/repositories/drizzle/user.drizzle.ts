import { DbUser, users } from "../../infra/db/schema";
import User from "../../domain/user";
import { db } from "server/src/infra/db/db";
import { eq, and, count, gte } from "drizzle-orm";
import { DbInsertUser } from "server/src/infra/db/schema/users.schema";
import UsersRepository from "../interfaces/users.repository";

export default class UsersDrizzleRepository implements UsersRepository {
  async insertUser(userData: DbInsertUser): Promise<User> {
    const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      }).returning();
    return this.toDomainUser(user as DbUser);
  }

  async createGuestUser(): Promise<User> {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: guestId,
        isGuest: true,
        email: null,
        firstName: null,
        lastName: null,
      })
      .returning();
    return this.toDomainUser(user);
  }

  async getRegisteredUsers(): Promise<User[]> {
    const dbUsers: DbUser[] = await db.select().from(users).where(eq(users.isGuest, false));
    return dbUsers.map(this.toDomainUser);
  }

  async updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ emailEnabled: enabled, emailDeliveryHour: deliveryHour })
      .where(eq(users.id, userId))
      .returning();
    return user ? this.toDomainUser(user as DbUser) : null;
  }

  async getUsersForEmailAlert(hour: number): Promise<User[]> {
    // get users who have email enabled and delivery hour matches and are not guests
    const dbUsers: DbUser[] = await db
      .select()
      .from(users)
      .where(and(eq(users.emailEnabled, true), eq(users.emailDeliveryHour, hour), eq(users.isGuest, false))); 
      
      return dbUsers.map(this.toDomainUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? this.toDomainUser(user as DbUser) : null;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isAdmin }).where(eq(users.id, userId)).returning();
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async getSignupsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: count() }).from(users).where(gte(users.createdAt, today));
    return result[0]?.count || 0;
  }

  async getSignupsTotal(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }

  toDomainUser(dbUser: DbUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email ?? undefined,
      name: dbUser.firstName && dbUser.lastName
        ? { first: dbUser.firstName, last: dbUser.lastName }
        : undefined,
      role: dbUser.isAdmin ? "admin" : dbUser.isGuest ? "guest" : "user",
      emailPreferences: {
        enabled: dbUser.emailEnabled ?? true,
        deliveryHour: dbUser.emailDeliveryHour ?? 8,
      },
    };
  }
}