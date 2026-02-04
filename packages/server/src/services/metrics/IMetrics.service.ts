export default interface IMetricsService {
    recordPageView(path: string, userId: string | undefined, sessionId: string | undefined, userAgent: string | undefined): Promise<void>;
    getUserSession(authHeader?: string, guestUserId?: string): Promise<string>;
}