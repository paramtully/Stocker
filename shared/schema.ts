export type UserRole = "admin" | "user" | "guest";

export interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: UserRole;
  emailPreferences?: {
    enabled: boolean;
    deliveryHour: number;
  };
}

