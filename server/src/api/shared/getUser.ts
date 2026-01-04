import { RequestWithCognitoUser } from "./types";

// Helper to get user ID from request (authenticated or guest)
export default function getUserId(req: RequestWithCognitoUser): string | undefined {
    // Check for authenticated Cognito user
    return req.cognitoUser?.sub;
}