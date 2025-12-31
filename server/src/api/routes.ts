import { Express } from "express";
import { authController } from "./controllers/auth.controller";
import { stocksController } from "./controllers/stocks.controller";
import { newsController } from "./controllers/news.controller";
import { portfolioController } from "./controllers/portfolio.controller";
import { settingsController } from "./controllers/settings.controller";
import { trackController } from "./controllers/track.controller";
import { adminController } from "./controllers/admin.controller";


export async function registerRoutes(app: Express): Promise<void> {
    // set up auth
    await setupAuth(app);

    // Auth Routes                                         
    app.get("/api/auth/user", authController.getAuthUser);
    app.get("/api/auth/status", authController.getAuthStatus);                                      // check if user is authenticated (not guest)

    // Stocks Routes (general stock data - not user-specific)
    app.get("/api/stocks/search", stocksController.searchStocksByPrefix);  // search NASDAQ tickers by prefix
    // Future: app.get("/api/stocks/:ticker", stocksController.getStockInfo); // get general stock info

    // Portfolio Routes (user's holdings/portfolio)
    app.get("/api/portfolio/quotes", portfolioController.getUserQuotes);  // get all quotes (stock / holding) in user's portfolio
    app.post("/api/portfolio/holdings", portfolioController.addUserHolding);  // add a stock to portfolio
    app.delete("/api/portfolio/holdings/:ticker", portfolioController.removeUserHolding);  // remove a stock from portfolio
    app.get("/api/portfolio/overview", portfolioController.getPortfolioOverview);  // get portfolio overview stats
    app.get("/api/portfolio/charts", portfolioController.getPortfolioCharts);  // get portfolio charts

    // News Routes
    app.get("/api/news", newsController.getUserNews);  // get paginated news for portfolio stocks

    // Settings Routes
    app.get("/api/settings/email", settingsController.getEmailSettings);                            // get email settings (verify, resend, test)
    app.put("/api/settings/email", settingsController.updateEmailSettings);                         // update email settings    

    // Tracking Routes
    app.post("/api/track/pageview", trackController.trackPageview);                                 // track pageview
    
    // Admin Routes
    app.get("/api/admin/check", adminController.checkAdmin);                                        // check if user is admin
    app.get("/api/admin/metrics", adminController.getAdminMetrics);                                 // gets admin dashboard metrics
}