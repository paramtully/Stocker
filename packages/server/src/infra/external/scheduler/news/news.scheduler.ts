
export default abstract class NewsScheduler {
    abstract start(): void;
    abstract stop(): void;
    abstract fetchNewsForAllPortfolios(): Promise<void>;
}