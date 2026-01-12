// creates the express app and registers the routes
import express from "express"
import { registerRoutes } from "./routes.ts"
import { requestLogger } from "./middleware/requestLogger.ts"
import { errorHandler } from "./middleware/errorHandler.ts"
import { bodyParser } from "./middleware/bodyParser.ts"
import cookieParser from "cookie-parser";

export async function createApp() {
    const app = express();
  
    app.use(bodyParser);
    app.use(requestLogger);
    
    app.set("trust proxy", 1);
    app.use(cookieParser());
  
    await registerRoutes(app);
  
    // must come after all routes
    app.use(errorHandler);
  
    return app;
}