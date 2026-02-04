import IAuthService from "./IAuth.service";
import UsersRepository from "../../repositories/interfaces/users.repository";
import { User, UserRole } from "packages/domain/src/user/index";
import UsersDrizzleRepository from "../../repositories/drizzle/user.drizzle";
import { AuthCognitoClient } from "../../infra/external/auth";
import { db } from "../../../db/src/db";
import { users } from "../../../db/src/schema";
import { eq } from "drizzle-orm";

export default class AuthService implements IAuthService {
    private readonly usersRepository: UsersRepository;
    private readonly cognitoClient: AuthCognitoClient;

    constructor() {
        this.usersRepository = new UsersDrizzleRepository();
        this.cognitoClient = new AuthCognitoClient();
    }

    async getUserById(userId: string): Promise<User | undefined> {
        return await this.usersRepository.getUserById(userId);
    }

    async insertUser(user: User): Promise<void> {
        await this.usersRepository.insertUser(user);
    }

    async updateUserRole(userId: string, role: UserRole): Promise<void> {
        await db.update(users)
            .set({
                role,
                expiresAt: role === "guest" ? undefined : null, // Clear expiresAt for non-guests
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async updateUserEmail(userId: string, email: string): Promise<void> {
        await db.update(users)
            .set({
                email,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        return await this.usersRepository.getUserByEmail(email);
    }

}