import EmailSettings from "server/src/domain/emailSettings";

export default interface SettingsService {
    getEmailSettings(userId: string): Promise<EmailSettings>;
    updateEmailSettings(userId: string, emailSettings: EmailSettings): Promise<void>;
}