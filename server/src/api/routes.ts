import { Express } from "express";
import { authController } from "./controllers/auth.controller";
import { stocksController } from "./controllers/stocks.controller";
import { newsController } from "./controllers/news.controller";
import { portfolioController } from "./controllers/portfolio.controller";
import { settingsController } from "./controllers/settings.controller";
import { emailController } from "./controllers/email.controller";
import { trackController } from "./controllers/track.controller";
import { adminController } from "./controllers/admin.controller";


export async function registerRoutes(app: Express): Promise<void> {
    // set up auth
    await setupAuth(app);

    // Auth Routes                                         
    app.get("/api/auth/user", authController.getAuthUser);
    app.get("/api/auth/status", authController.getAuthStatus);                                      // check if user is authenticated (not guest)

    // // Stocks Routes (get general stock data)
    // app.get("/api/stocks", authController.ensureUserIsAuthenticated, stocksController.getUserHoldings);   // get all stocks (holdings) for the user
    // app.get("/api/stocks/quotes", stocksController.getUserQuotes);                                 // get quotes for each stock in the user's portfolio -> obj format as below:
    // /* 
    //                                                                         {
    //                                                                             ticker: string;        // Stock symbol (e.g., "AAPL")
    //                                                                             companyName: string;   // Company name (e.g., "Apple Inc.")
    //                                                                             price: number;         // Current stock price
    //                                                                             changePercent: number; // Percentage change (positive or negative)
    //                                                                         }
    //                                                                         example: 
    //                                                                         {
    //                                                                         "ticker": "AAPL",
    //                                                                         "companyName": "Apple Inc.",
    //                                                                         "price": 178.52,
    //                                                                         "changePercent": 2.34
    //                                                                         }
    // */
    // // app.get("/api/stocks/:ticker/chart", stocksController.getChart);                                // get chart data for the stock
    // // app.get("/api/stocks/:ticker/charts", stocksController.getAllCharts);                           // get all periodic chart data for a stock
    // // app.get("/api/stocks/:ticker/price/:date", stocksController.getPriceForDate);                   // get price for a stock on a specific date
    // app.get("/api/stocks/search/", stocksController.searchStocksByPrefix);                              // search NASDAQ tickers by prefix
    // app.post("/api/stocks/", stocksController.addUserHolding);                                    // add a stock to the user's portfolio
    // app.delete("/api/stocks/:ticker", stocksController.removeUserHolding);                      // remove a stock from the user's portfolio


    // // News Routes
    // app.get("/api/news", newsController.getUserNews);                                                   // get paginated news for portfolio stocks (with optional ticker filter)
    
    // // Portfolio Routes
    // app.get("/api/portfolio/overview", portfolioController.getPortfolioOverview);                   // get portfolio overivew stats
    // app.get("/api/portfolio/charts", portfolioController.getPortfolioCharts);                       // get portfolio charts

    // Stocks Routes (general stock data - not user-specific)
    app.get("/api/stocks/search", stocksController.searchStocksByPrefix);  // search NASDAQ tickers by prefix
    // Future: app.get("/api/stocks/:ticker", stocksController.getStockInfo); // get general stock info

    // Portfolio Routes (user's holdings/portfolio)
    app.get("/api/portfolio", authController.ensureUserIsAuthenticated, stocksController.getUserHoldings);  // get all holdings in user's portfolio
    app.get("/api/portfolio/quotes", stocksController.getUserQuotes);  // get quotes for each stock in portfolio
    app.post("/api/portfolio", stocksController.addUserHolding);  // add a stock to portfolio
    app.delete("/api/portfolio/:ticker", stocksController.removeUserHolding);  // remove a stock from portfolio
    app.get("/api/portfolio/overview", portfolioController.getPortfolioOverview);  // get portfolio overview stats
    app.get("/api/portfolio/charts", portfolioController.getPortfolioCharts);  // get portfolio charts

    // News Routes
    app.get("/api/news", newsController.getUserNews);  // get paginated news for portfolio stocks

    // Settings Routes
    app.get("/api/settings/email", settingsController.getEmailSettings);                            // get email settings (verify, resend, test)
    app.put("/api/settings/email", settingsController.updateEmailSettings);                         // update email settings    
    
    // Email Routes
    // app.post("/api/email/test", emailController.testEmail);                                         // sent email (testing)
    app.post("/api/email/", emailController.sendEmail);                                             // send email

    // Tracking Routes
    app.post("/api/track/pageview", trackController.trackPageview);                                 // track pageview
    
    // Admin Routes
    app.get("/api/admin/check", adminController.checkAdmin);                                        // check if user is admin
    app.get("/api/admin/metrics", adminController.getAdminMetrics);                                 // gets admin dashboard metrics
}