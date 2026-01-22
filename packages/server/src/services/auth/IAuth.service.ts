import { User, UserRole } from "packages/domain/src/user";

// interface for auth related database operations
export default interface IAuthService {
    getUserById(userId: string): Promise<User | undefined>;
    insertUser(user: User): Promise<void>; // into db
    updateUserRole(userId: string, role: UserRole): Promise<void>;
    updateUserEmail(userId: string, email: string): Promise<void>;
    getUserByEmail(email: string): Promise<User | undefined>;
}