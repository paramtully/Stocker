import { NewsSummary } from "packages/domain/src/news";
import Quote from "packages/domain/src/stock/quote";
import { Holding } from "packages/domain/src/portfolio";
import { User } from "packages/domain/src/user/index";

export default abstract class EmailScheduler {
    abstract start(): void;
    abstract getPortfolioHoldingsByEmail(): Promise<Record<string, Holding[]>>;
    abstract getUsersForEmailAlert(hour: number): Promise<User[]>;
    abstract sendScheduledEmails(hour: number): Promise<void>;
    abstract sendDailyEmail(userId: string, email: string): Promise<void>;
    abstract triggerTestEmail(email: string): Promise<void>;
    protected generateFallbackEmail(quotes: Quote[], newsSummaries: NewsSummary[]): string {
        const date = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    
        let email = `Stocker Daily Summary - ${date}\n\n`;
        email += "PORTFOLIO OVERVIEW\n";
        email += "==================\n\n";
    
        for (const quote of quotes) {
          const sign = quote.changePercent >= 0 ? "+" : "";
          email += `${quote.ticker} (${quote.companyName}): $${quote.price.toFixed(2)} (${sign}${quote.changePercent.toFixed(2)}%)\n`;
        }
    
        if (newsSummaries.length > 0) {
          email += "\n\nTOP NEWS\n";
          email += "========\n\n";
    
          for (const news of newsSummaries) {
            const sentimentEmoji = news.sentiment === "positive" ? "[+]" : news.sentiment === "negative" ? "[-]" : "[~]";
            email += `${sentimentEmoji} [${news.ticker}] ${news.headline}\n`;
          }
        }
    
        email += "\n\nView your full portfolio and detailed analysis at Stocker.";
        return email;
    }
}