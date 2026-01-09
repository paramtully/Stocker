import { DbUser, users } from "../../infra/db/schema";
import { User, UserRole } from "server/src/domain/user/index";
import { db } from "server/src/infra/db/db";
import { eq, and, count, gte, not, or } from "drizzle-orm";
import { DbInsertUser } from "server/src/infra/db/schema/users.schema";
import UsersRepository from "../interfaces/users.repository";

export default class UsersDrizzleRepository implements UsersRepository {
  async insertUser(userData: User): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required");
    }
    const dbUser: DbInsertUser = {
      id: userData.id,
      email: userData.email,
      firstName: userData.name?.first,
      lastName: userData.name?.last,
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
        },
      }).returning();
    return this.toDomainUser(user as DbUser);
  }

  async getRegisteredUsers(): Promise<User[]> {
    const dbUsers: DbUser[] = await db.select().from(users).where(or(eq(users.role, "user"), eq(users.role, "admin")));
    return dbUsers.map(this.toDomainUser);
  }

  async updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ emailEnabled: enabled, emailDeliveryHour: deliveryHour })
      .where(eq(users.id, userId))
      .returning();
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async getUsersForEmailAlert(hour: number): Promise<User[]> {
    // get users who have email enabled and delivery hour matches and are not guests
    const dbUsers: DbUser[] = await db
      .select()
      .from(users)
      .where(and(eq(users.emailEnabled, true), eq(users.emailDeliveryHour, hour), not(eq(users.role, "guest")))); 
      
      return dbUsers.map(this.toDomainUser);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ? this.toDomainUser(user as DbUser) : undefined;
  }

  async setUserAdmin(userId: string, role: UserRole): Promise<User | undefined> {
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
      role: dbUser.role as UserRole,
      emailPreferences: {
        enabled: dbUser.emailEnabled ?? true,
        deliveryHour: dbUser.emailDeliveryHour ?? 8,
      },
    };
  }

  toDbInsertUser(domainUser: User): DbInsertUser {
    if (!domainUser.id) {
      throw new Error("User ID is required");
    }
    return {
      id: domainUser.id,
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