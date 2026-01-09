import IAuthService from "./IAuth.service";
import UsersRepository from "server/src/repositories/interfaces/users.repository";
import { User } from "server/src/domain/user/index";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import { AuthCognitoClient } from "server/src/infra/external/auth/aws";

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

}