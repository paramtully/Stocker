import IAuthService from "./IAuth.service";
import UsersRepository from "server/src/repositories/interfaces/users.repository";
import User from "server/src/domain/user";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import { v4 as uuid } from 'uuid';

export default class AuthService implements IAuthService {
    private readonly usersRepository: UsersRepository;

    constructor() {
        this.usersRepository = new UsersDrizzleRepository();
    }

    async getUser(cognitoSub: string): Promise<User | undefined> {
        const user = await this.usersRepository.getUserByCognitoSub(cognitoSub);
        return user ? 
        {
            email: user.email,
            name: user.name,
            role: user.role,
            emailPreferences: user.emailPreferences,
        } as User : undefined;
    }

    async createGuestUser(): Promise<{ accessToken: string, idToken: string, expiresIn: number }> {
        const username: string = `guest_${uuid()}`;

        try {

            // Create Cognito user
            const createRes = await cognito.adminCreateUser({
                UserPoolId: process.env.COGNITO_USER_POOL_ID!,
                Username: username,
                TemporaryPassword: uuid(), // never exposed
                MessageAction: "SUPPRESS",
                UserAttributes: [
                { Name: "custom:userType", Value: "guest" }
                ]
            });

            const sub = createRes.User?.Attributes?.find(
                a => a.Name === "sub"
            )?.Value;
          
            // Exchange for tokens
            const authRes = await cognito.adminInitiateAuth({
                UserPoolId: process.env.COGNITO_USER_POOL_ID!,
                ClientId: process.env.COGNITO_CLIENT_ID!,
                AuthFlow: "ADMIN_NO_SRP_AUTH",
                AuthParameters: {
                USERNAME: username,
                PASSWORD: createRes.User?.TemporaryPassword ?? uuid()
                }
            });

            // Create DB user
            await this.usersRepository.insertUser({
                cognitoSub: sub!,
                role: "guest",
                emailPreferences: { enabled: false, deliveryHour: 8 },
            });

            // Return tokens
            return {
                accessToken: authRes.AuthenticationResult?.AccessToken,
                idToken: authRes.AuthenticationResult?.IdToken,
                expiresIn: authRes.AuthenticationResult?.ExpiresIn
            };
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create guest user");
        }
    }

    async getUserByCognitoSub(cognitoSub: string): Promise<User | undefined> {
        return this.usersRepository.getUserByCognitoSub(cognitoSub);
    }

    async insertUser(user: User): Promise<void> {
        await this.usersRepository.insertUser(user);
    }
}