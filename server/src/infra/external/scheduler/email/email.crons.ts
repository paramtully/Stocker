import { Holding } from "server/src/domain/portfolio";
import EmailScheduler from "./email.scheduler";
import { User } from "server/src/domain/user/index";
import UsersRepository from "server/src/repositories/interfaces/users.repository";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import PortfolioService from "server/src/services/portfolio/portfolio.service";
import cron from "node-cron";
import { mockNews } from "server/src/infra/mocks/news.mock";
import { mockQuotes } from "server/src/infra/mocks/quote.mock";
import {INewsService, NewsService} from "server/src/services/news/";
import { IPortfolioService } from "server/src/services/portfolio";

export default class EmailCrons extends EmailScheduler {
    private isRunning: boolean = false;
    private usersRepository: UsersRepository;
    private portfolioService: IPortfolioService;
    private newsService: INewsService;

    constructor() {
        super();
        this.usersRepository = new UsersDrizzleRepository();
        this.portfolioService = new PortfolioService();
        this.newsService = new NewsService();
        this.start();
    }
    
    start() {
        if (this.isRunning) {
          console.log("Email scheduler already running");
          return;
        }
    
        // Run every hour to check for users who should receive emails
        cron.schedule("0 * * * *", async () => {
          const currentHour = new Date().getHours();
          console.log(`[EmailScheduler] Checking for emails to send at hour ${currentHour}`);
          
          try {
            await this.sendScheduledEmails(currentHour);
          } catch (error) {
            console.error("[EmailScheduler] Error sending scheduled emails:", error);
          }
        });
    
        this.isRunning = true;
        console.log("[EmailScheduler] Started - checking every hour for scheduled emails");
    }

    async sendScheduledEmails(hour: number) {
        try {
          // Get users who have email enabled and delivery hour matches
          const users = await this.getUsersForEmailAlert(hour);
          
          if (users.length === 0) {
            console.log(`[EmailScheduler] No users scheduled for hour ${hour}`);
            return;
          }
    
          console.log(`[EmailScheduler] Sending emails to ${users.length} users`);
    
          for (const user of users) {
            if (!user.email) continue;
            
            try {
              await this.sendDailyEmail(user.id!, user.email);
              console.log(`[EmailScheduler] Email sent to ${user.email}`);
            } catch (error) {
              console.error(`[EmailScheduler] Failed to send email to ${user.email}:`, error);
            }
          }
        } catch (error) {
          console.error("[EmailScheduler] Error in sendScheduledEmails:", error);
        }
    }
    
    async sendDailyEmail(userId: string, email: string) {
        let dailyEmailSummary: string = await this.newsService.summarizeUserNews(userId);
        if (dailyEmailSummary === '') {
            dailyEmailSummary = this.generateFallbackEmail(mockQuotes, mockNews.flat());
        }

        // Log the email (in production, this would send via SES, SendGrid, etc.)
        console.log(`[EmailScheduler] Email content for ${email}:`);
        console.log("---");
        console.log(dailyEmailSummary);
        console.log("---");

        // TODO: Integrate with email service (SES, SendGrid, Replit Mail, etc.)
        // For now, just log the email content
    }

    async getPortfolioHoldingsByEmail(): Promise<Record<string, Holding[]>> {
        const users: User[] = await this.usersRepository.getRegisteredUsers()
        const usersWithEmailEnabled: User[] = users.filter((u) => u.emailPreferences.enabled);

        const results = await Promise.all(
        usersWithEmailEnabled.map(async (user) => {
            const holdings = await this.portfolioService.getUserHoldings(user.id!);
            return { email: user.email, holdings };
        }));
        
        return results.reduce((acc, { email, holdings }) => {
            if (email) {
                acc[email] = holdings;
            }
            return acc;
        }, {} as Record<string, Holding[]>);
    }
    

    async triggerTestEmail(email: string): Promise<void> {
        console.log(`[EmailScheduler] Triggering test email to ${email}`);
        await this.sendDailyEmail("test-user-id", email);
        console.log(`[EmailScheduler] Test email sent to ${email}`);
    }

    async getUsersForEmailAlert(hour: number): Promise<User[]> {
        return this.usersRepository.getUsersForEmailAlert(hour);
    }
}