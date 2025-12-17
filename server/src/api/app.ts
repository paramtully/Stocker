// creates the express app and registers the routes

import express from "express"
import { registerRoutes } from "./api/routes"
import { requestLogger } from "./middleware/requestLogger"
import { errorHandler } from "./middleware/errorHandler"
import { bodyParser } from "./middleware/bodyParser"

export async function createApp() {
    const app = express();
  
    app.use(bodyParser);
    app.use(requestLogger)
  
    await registerRoutes(app);
  
    // must come after all routes
    app.use(errorHandler);
  
    return app;
}