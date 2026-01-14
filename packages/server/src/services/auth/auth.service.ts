import IAuthService from "./IAuth.service";
import UsersRepository from "../../repositories/interfaces/users.repository";
import { User } from "packages/domain/src/user/index";
import UsersDrizzleRepository from "../../repositories/drizzle/user.drizzle";
import { AuthCognitoClient } from "../../infra/external/auth";

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