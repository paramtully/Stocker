export default interface PageView {
    path: string;
    userId: string | undefined;
    sessionId: string | undefined;
    userAgent: string | undefined;
}