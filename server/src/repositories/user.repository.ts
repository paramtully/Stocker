import { DbUser } from "../infra/db/schema";
import User from "../domain/user";

export function toDomainUser(db: DbUser): User {
  return {
    id: db.id,
    email: db.email ?? undefined,
    name: db.firstName && db.lastName
      ? { first: db.firstName, last: db.lastName }
      : undefined,
    role: db.isAdmin ? "admin" : db.isGuest ? "guest" : "user",
    emailPreferences: {
      enabled: db.emailEnabled ?? true,
      deliveryHour: db.emailDeliveryHour ?? 8,
    },
  };
}