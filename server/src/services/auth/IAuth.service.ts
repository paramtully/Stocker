import User from "server/src/domain/user";

export default interface IAuthService {
    getUser(token: string): Promise<User | null>;
}