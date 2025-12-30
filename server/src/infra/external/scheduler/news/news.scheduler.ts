export default abstract class NewsScheduler {
    abstract start(): void;
    abstract scheduleEmail(hour: number): Promise<void>;
    abstract sendDailyEmail(userId: string, email: string): Promise<void>;
    abstract triggerTestEmail(email: string): Promise<void>;

    private generateFallbackEmail(
        stocks: { ticker: string; companyName: string; price: number; changePercent: number }[],
        newsHighlights: { ticker: string; headline: string; sentiment: string }[]
      ): string {
        const date = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    
        let email = `Stocker Daily Summary - ${date}\n\n`;
        email += "PORTFOLIO OVERVIEW\n";
        email += "==================\n\n";
    
        for (const stock of stocks) {
          const sign = stock.changePercent >= 0 ? "+" : "";
          email += `${stock.ticker} (${stock.companyName}): $${stock.price.toFixed(2)} (${sign}${stock.changePercent.toFixed(2)}%)\n`;
        }
    
        if (newsHighlights.length > 0) {
          email += "\n\nTOP NEWS\n";
          email += "========\n\n";
    
          for (const news of newsHighlights) {
            const sentimentEmoji = news.sentiment === "positive" ? "[+]" : news.sentiment === "negative" ? "[-]" : "[~]";
            email += `${sentimentEmoji} [${news.ticker}] ${news.headline}\n`;
          }
        }
    
        email += "\n\nView your full portfolio and detailed analysis at Stocker.";
        return email;
      }

}