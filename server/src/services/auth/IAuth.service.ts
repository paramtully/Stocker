import { User } from "server/src/domain/user";

// interface for auth related database operations
export default interface IAuthService {
    getUserById(userId: string): Promise<User | undefined>;
    insertUser(user: User): Promise<void>; // into db
}