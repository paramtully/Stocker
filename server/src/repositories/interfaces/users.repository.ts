import User from "server/src/domain/user";
import { DbInsertUser, DbUser } from "server/src/infra/db/schema/users.schema";

export default interface UsersRepository {
    // Existing methods...
    getUserById(id: string): Promise<User | null>;
    insertUser(user: User): Promise<User>;
    getRegisteredUsers(): Promise<User[]>;
    updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | null>;
    getUsersForEmailAlert(hour: number): Promise<User[]>;
    
    // Add these from pageViews repository:
    getUserByEmail(email: string): Promise<User | undefined>;
    setUserAdmin(userId: string, role: "admin" | "user" | "guest"): Promise<User | undefined>;
    getSignupsToday(): Promise<number>;      // Queries users.createdAt
    getSignupsTotal(): Promise<number>;      // Queries users
    getTotalUsers(): Promise<number>;        // Queries users
    
    // Mapper
    toDomainUser(db: DbUser): User;
    toDbInsertUser(domainUser: User): DbInsertUser;
}