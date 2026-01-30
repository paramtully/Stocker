// Lambda handler for AWS Lambda using @vendia/serverless-express
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "./api/app";
import { serveStatic } from "./infra/frontend/serveStatic";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

// Create the Express app and serve static files
const appPromise = createApp().then(app => {
    serveStatic(app);
    return app;
});

// Create the Lambda handler wrapper
type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
let cachedHandler: LambdaHandler | undefined;

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    // Initialize handler on first invocation
    if (!cachedHandler) {
        const app = await appPromise;
        cachedHandler = serverlessExpress({ app }) as unknown as LambdaHandler;
    }
    return cachedHandler(event, context);
};

