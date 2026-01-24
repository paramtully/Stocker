// Lambda handler for AWS Lambda using @vendia/serverless-express
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "./api/app";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

// Create the Express app
const appPromise = createApp();

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

