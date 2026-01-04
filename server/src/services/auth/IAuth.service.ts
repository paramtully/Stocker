import User from "server/src/domain/user";

export default interface IAuthService {
    getUser(cognitoSub: string): Promise<User | undefined>;
    createGuestUser(): Promise<{ accessToken: string, idToken: string, expiresIn: number }>;
    insertUser(user: User): Promise<void>;
}