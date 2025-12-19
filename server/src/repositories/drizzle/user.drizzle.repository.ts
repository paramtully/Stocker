import { DbUser, users } from "../../infra/db/schema";
import User from "../../domain/user";
import UserRepository from "../interfaces/user.repository";
import { db } from "server/src/infra/db/db";
import { eq, and } from "drizzle-orm";
import { DbInsertUser } from "server/src/infra/db/schema/users.schema";


export default class UserDrizzleRepository implements UserRepository {
  async getUserById(id: string): Promise<User | null> {

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return user ? this.toDomainUser(user) : null;
  }

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
    return user;
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
    return user;
  }

  async updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ emailEnabled: enabled, emailDeliveryHour: deliveryHour })
      .where(eq(users.id, userId))
      .returning();
    return user ? this.toDomainUser(user) : null;
  }

  async getUsersForEmailAlert(hour: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.emailEnabled, true), eq(users.emailDeliveryHour, hour)));
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