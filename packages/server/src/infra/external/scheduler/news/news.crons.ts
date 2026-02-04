import NewsScheduler from "./news.scheduler";
import cron, { ScheduledTask } from "node-cron";
import LlmExternalService from "server/src/infra/external/llm/llm.external";
import LlmOpenAI from "server/src/infra/external/llm/llm.openAI";
import { NewsExternalService, NewsAlphaVantage } from "../../../../../../infra/src/external/news";
import NewsDrizzleRepository from "server/src/repositories/drizzle/news/news.drizzle.repository";
import NewsRepository from "server/src/repositories/interfaces/news/news.repository";
import StocksDrizzleRepository from "server/src/repositories/drizzle/stock/stock.drizzle";
import { StockRepository } from "server/src/repositories/interfaces/stock/";
import { INewsService, NewsService } from "server/src/services/news";

export default class NewsCrons extends NewsScheduler { 
    private isRunning: boolean = false;
    private morningJob: ScheduledTask | null = null;
    private eveningJob: ScheduledTask | null = null;
    private llmExternalService: LlmExternalService = new LlmOpenAI(process.env.OPENAI_API_KEY!);
    private newsExternalService: NewsExternalService = new NewsAlphaVantage();
    private newsRepository: NewsRepository = new NewsDrizzleRepository();
    private stockRepository: StockRepository = new StocksDrizzleRepository();
    private newsService: INewsService = new NewsService();

    start() {
        if (this.isRunning) {
          console.log("[NewsScheduler] Already running");
          return;
        }
    
        // Check if API key is configured
        if (!process.env.ALPHA_VANTAGE_API_KEY) {
          console.warn("[NewsScheduler] ALPHA_VANTAGE_API_KEY not configured - news will not be fetched automatically");
          return; // Don't start if API key is missing
        }
    
        // Run at 8am every day
        this.morningJob = cron.schedule("0 8 * * *", async () => {
          console.log("[NewsScheduler] Running 8am news fetch");
          try {
            await this.fetchNewsForAllPortfolios();
          } catch (error) {
            console.error("[NewsScheduler] Error in 8am news fetch:", error);
          }
        });
    
        // Run at 6pm every day
        this.eveningJob = cron.schedule("0 18 * * *", async () => {
          console.log("[NewsScheduler] Running 6pm news fetch");
          try {
            await this.fetchNewsForAllPortfolios();
          } catch (error) {
            console.error("[NewsScheduler] Error in 6pm news fetch:", error);
          }
        });
    
        this.isRunning = true;
        console.log("[NewsScheduler] Started - scheduled for 8am and 6pm daily");
    }   

    stop() {
        if (this.morningJob) {
          this.morningJob.stop();
          this.morningJob = null;
        }
        if (this.eveningJob) {
          this.eveningJob.stop();
          this.eveningJob = null;
        }
        this.isRunning = false;
        console.log("[NewsScheduler] Stopped");
    }

    async fetchNewsForAllPortfolios(): Promise<void> {
        try {
            // Get all stock tickers
            const stocks = await this.stockRepository.getStocks();
            const tickers = stocks.map(stock => stock.ticker);
            
            if (tickers.length === 0) {
                console.log("[NewsScheduler] No tickers found, skipping news fetch");
                return;
            }
            
            // Get the date of the latest news summary
            const latestArticleDate = await this.newsRepository.getDateofLatestNewsSummary();
            
            // Fetch latest news articles for all tickers
            const newsArticlesRecord = await this.newsExternalService.getAllLatestNewsArticles(tickers, latestArticleDate);
            
            // Flatten the record into an array
            const newsArticles = Object.values(newsArticlesRecord).flat();
            
            if (newsArticles.length === 0) {
                console.log("[NewsScheduler] No new news articles found");
                return;
            }
            
            // Process and save news summaries
            await this.newsService.addNewsSummary(newsArticles);
            console.log(`[NewsScheduler] Successfully processed ${newsArticles.length} news articles`);
        } catch (error) {
            console.error("[NewsScheduler] Error fetching news for all portfolios:", error);
            throw error; // Re-throw to be caught by cron job handlers
        }
    }
}