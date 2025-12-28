export default interface PageView {
    path: string;
    userId: string | undefined;
    sessionId: string;
    userAgent: string | undefined;
}