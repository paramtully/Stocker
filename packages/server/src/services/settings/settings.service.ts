import UsersRepository from "server/src/repositories/interfaces/users.repository";
import ISettingsService from "./ISettings.service";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import EmailSettings from "packages/domain/src/emailSettings";

export default class SettingsService implements ISettingsService {
    private readonly usersRepository: UsersRepository;

    constructor() {
        this.usersRepository = new UsersDrizzleRepository();
    }

    async getEmailSettings(userId: string): Promise<EmailSettings> {
        const user = await this.usersRepository.getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.email) {
            throw new Error("Email not configured");
        }
        return {
            email: user.email,
            enabled: user.emailPreferences.enabled,
            deliveryHour: user.emailPreferences.deliveryHour,
        };
    }

    async updateEmailSettings(userId: string, emailSettings: EmailSettings): Promise<void> {
        const user = await this.usersRepository.updateUserEmailSettings(userId, emailSettings.enabled, emailSettings.deliveryHour);
        if (!user) {
            throw new Error("Failed to update email settings");
        }
    }
}