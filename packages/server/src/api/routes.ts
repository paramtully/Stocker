import { Express } from "express";
import { authController } from "./controllers/auth.controller";
import { stocksController } from "./controllers/stocks.controller";
import { newsController } from "./controllers/news.controller";
import { portfolioController } from "./controllers/portfolio.controller";
import { settingsController } from "./controllers/settings.controller";
import { trackController } from "./controllers/track.controller";
import { adminController } from "./controllers/admin.controller";
import { adminOnly } from "./middleware/adminOnly";
import { unInterceptedUserHandler } from "./middleware/unInterceptedUserHandler";
import { interceptedUserHandler } from "./middleware/interceptedUserHandler";

export async function registerRoutes(app: Express): Promise<void> {

    // Auth Routes                                         
    app.get("/api/auth/user", interceptedUserHandler, authController.getUser);                            // gets user info from the auth token
    app.get("/api/auth/guest", unInterceptedUserHandler);                                                 // creates a guest user and returns tokens

    // Stocks Routes (general stock data - not user-specific)
    app.get("/api/stocks/search", stocksController.searchStocksByPrefix);  // search NASDAQ tickers by prefix
    // Future: app.get("/api/stocks/:ticker", stocksController.getStockInfo); // get general stock info

    // Portfolio Routes (user's holdings/portfolio)
    app.get("/api/portfolio/quotes", interceptedUserHandler, portfolioController.getUserQuotes);  // get all quotes (stock / holding) in user's portfolio
    app.post("/api/portfolio/holdings", interceptedUserHandler, portfolioController.addUserHolding);  // add a stock to portfolio
    app.delete("/api/portfolio/holdings/:ticker", interceptedUserHandler, portfolioController.removeUserHolding);  // remove a stock from portfolio
    app.get("/api/portfolio/overview", interceptedUserHandler, portfolioController.getPortfolioOverview);  // get portfolio overview stats
    app.get("/api/portfolio/charts", interceptedUserHandler, portfolioController.getPortfolioCharts);  // get portfolio charts

    // News Routes
    app.get("/api/news", interceptedUserHandler, newsController.getUserNews);  // get paginated news for portfolio stocks

    // Settings Routes
    app.get("/api/settings/email", interceptedUserHandler, settingsController.getEmailSettings);                            // get email settings (verify, resend, test)
    app.put("/api/settings/email", interceptedUserHandler, settingsController.updateEmailSettings);                         // update email settings    

    // Tracking Routes
    app.post("/api/track/pageview", interceptedUserHandler, trackController.trackPageview);                                 // track pageview
    
    // Admin Routes
    // app.get("/api/admin/check", adminController.checkAdmin);                                        // check if user is admin
    app.get("/api/admin/metrics", interceptedUserHandler, adminOnly, adminController.getAdminMetrics);                                 // gets admin dashboard metrics
}