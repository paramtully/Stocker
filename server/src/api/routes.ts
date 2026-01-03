import { Express } from "express";
import { authController } from "./controllers/auth.controller";
import { stocksController } from "./controllers/stocks.controller";
import { newsController } from "./controllers/news.controller";
import { portfolioController } from "./controllers/portfolio.controller";
import { settingsController } from "./controllers/settings.controller";
import { trackController } from "./controllers/track.controller";
import { adminController } from "./controllers/admin.controller";
import { adminVerify } from "./middleware/adminVerify";
import { cognitoVerify } from "./middleware/cognitoVerify";



export async function registerRoutes(app: Express): Promise<void> {
    // set up auth
    await setupAuth(app);

    // Auth Routes                                         
    app.get("/api/auth/user", authController.getUser);                                          // gets user info from the auth token

    // Stocks Routes (general stock data - not user-specific)
    app.get("/api/stocks/search", stocksController.searchStocksByPrefix);  // search NASDAQ tickers by prefix
    // Future: app.get("/api/stocks/:ticker", stocksController.getStockInfo); // get general stock info

    // Portfolio Routes (user's holdings/portfolio)
    app.get("/api/portfolio/quotes", cognitoVerify, portfolioController.getUserQuotes);  // get all quotes (stock / holding) in user's portfolio
    app.post("/api/portfolio/holdings", cognitoVerify, portfolioController.addUserHolding);  // add a stock to portfolio
    app.delete("/api/portfolio/holdings/:ticker", cognitoVerify, portfolioController.removeUserHolding);  // remove a stock from portfolio
    app.get("/api/portfolio/overview", cognitoVerify, portfolioController.getPortfolioOverview);  // get portfolio overview stats
    app.get("/api/portfolio/charts", cognitoVerify, portfolioController.getPortfolioCharts);  // get portfolio charts

    // News Routes
    app.get("/api/news", cognitoVerify, newsController.getUserNews);  // get paginated news for portfolio stocks

    // Settings Routes
    app.get("/api/settings/email", cognitoVerify, settingsController.getEmailSettings);                            // get email settings (verify, resend, test)
    app.put("/api/settings/email", cognitoVerify, settingsController.updateEmailSettings);                         // update email settings    

    // Tracking Routes
    app.post("/api/track/pageview", cognitoVerify, trackController.trackPageview);                                 // track pageview
    
    // Admin Routes
    // app.get("/api/admin/check", adminController.checkAdmin);                                        // check if user is admin
    app.get("/api/admin/metrics", adminVerify, adminController.getAdminMetrics);                                 // gets admin dashboard metrics
}