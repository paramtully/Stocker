import { User, UserRole } from "packages/domain/src/user";
import { DbInsertUser, DbUser } from "../../../db/src/schema/users.schema";

export default interface UsersRepository {
    // Existing methods...
    getUserById(id: string): Promise<User | undefined>;
    insertUser(user: User): Promise<User>;
    getRegisteredUsers(): Promise<User[]>;
    updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | undefined>;
    getUsersForEmailAlert(hour: number): Promise<User[]>;
    
    // Add these from pageViews repository:
    getUserByEmail(email: string): Promise<User | undefined>;
    setUserAdmin(userId: string, role: UserRole): Promise<User | undefined>;
    getSignupsToday(): Promise<number>;      // Queries users.createdAt
    getSignupsTotal(): Promise<number>;      // Queries users
    getTotalUsers(): Promise<number>;        // Queries users
    getExpiredGuestUsers(): Promise<DbUser[]>;  // Queries expired guest users
    
    // Mapper
    toDomainUser(db: DbUser): User;
    toDbInsertUser(domainUser: User): DbInsertUser;
}