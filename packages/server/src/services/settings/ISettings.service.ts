import EmailSettings from "packages/domain/src/emailSettings";

export default interface SettingsService {
    getEmailSettings(userId: string): Promise<EmailSettings>;
    updateEmailSettings(userId: string, emailSettings: EmailSettings): Promise<void>;
}