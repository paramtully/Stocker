import type { UserRole } from "./userRole";

export default interface User {
    id?: string;
    email?: string;
    name?: {
      first: string;
      last: string;
    };
    role: UserRole;
    emailPreferences: {
      enabled: boolean;
      deliveryHour: number;
    };
}