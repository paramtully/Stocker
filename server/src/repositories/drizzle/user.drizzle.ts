import { DbUser, users } from "../../infra/db/schema";
import User from "../../domain/user";
import { db } from "server/src/infra/db/db";
import { eq, and, count, gte, not } from "drizzle-orm";
import { DbInsertUser } from "server/src/infra/db/schema/users.schema";
import UsersRepository from "../interfaces/users.repository";

export default class UsersDrizzleRepository implements UsersRepository {
  async insertUser(userData: User): Promise<User> {
    const dbUser: DbInsertUser = {
      cognitoSub: userData.cognitoSub ?? null,
      email: userData.email ?? null,
      firstName: userData.name?.first ?? null,
      lastName: userData.name?.last ?? null,
      emailEnabled: userData.emailPreferences.enabled,
      emailDeliveryHour: userData.emailPreferences.deliveryHour,
      role: userData.role,
    };
    const [user] = await db
    .insert(users)
    .values(dbUser)
    .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          cognitoSub: userData.cognitoSub ?? null,
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
        role: "guest",
        email: null,
        firstName: null,
        lastName: null,
      })
      .returning();
    return this.toDomainUser(user);
  }

  async getRegisteredUsers(): Promise<User[]> {
    const dbUsers: DbUser[] = await db.select().from(users).where(eq(users.role, "user"));
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
      .where(and(eq(users.emailEnabled, true), eq(users.emailDeliveryHour, hour), not(eq(users.role, "guest")))); 
      
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

  async getUserByCognitoSub(cognitoSub: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cognitoSub, cognitoSub)).limit(1);
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async setUserAdmin(userId: string, role: "admin" | "user" | "guest"): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
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
      role: dbUser.role as "admin" | "user" | "guest",
      emailPreferences: {
        enabled: dbUser.emailEnabled ?? true,
        deliveryHour: dbUser.emailDeliveryHour ?? 8,
      },
    };
  }

  toDbInsertUser(domainUser: User): DbInsertUser {
    return {
      cognitoSub: domainUser.cognitoSub,
      email: domainUser.email,
      firstName: domainUser.name?.first,
      lastName: domainUser.name?.last,
      emailEnabled: domainUser.emailPreferences.enabled,
      emailDeliveryHour: domainUser.emailPreferences.deliveryHour,
      role: domainUser.role,
      expiresAt: domainUser.role === "guest" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
    };
  }
}