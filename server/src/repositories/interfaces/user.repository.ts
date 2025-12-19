import User from "server/src/domain/user";
import { DbInsertUser, DbUser } from "server/src/infra/db/schema/users.schema";

export default interface UserRepository {
    getUserById(id: string): Promise<User | null>;
    insertUser(user: DbInsertUser): Promise<User>;
    createGuestUser(): Promise<User>;
    updateUserEmailSettings(userId: string, enabled: boolean, deliveryHour: number): Promise<User | null>;
    getUsersForEmailAlert(hour: number): Promise<User[]>;
    toDomainUser(db: DbUser): User;
}