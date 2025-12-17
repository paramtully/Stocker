import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockSchema } from "@shared/schema";
import { mockStocks, mockNews, getMockChartData, getMockStockQuote } from "./services/mockData";
import { createStockApiService } from "./services/stockApi";
import { createOpenAIService } from "./services/openai";
import { emailScheduler } from "./services/emailScheduler";
import { newsScheduler } from "./services/newsScheduler";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import passport from "passport";


export async function registerRoutes(app: Express): Promise<void> {
    // set up auth
    await setupAuth(app);

    // Auth Routes
    app.get("/api/auth/user", getAuthUser);
    app.get("/api/auth/status", getAuthStatus);                         // check if user is authenticated (not guest)
    app.get("/api/stocks", ensureUserIsAuthenticated, getStocks);
}