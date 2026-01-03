import { RequestWithCognitoUser } from "./types";

// Helper to get user ID from request (authenticated or guest)
export default function getUserId(req: RequestWithCognitoUser): string | undefined {
    // Check for authenticated Cognito user
    if (req.cognitoUser?.id) {
      return req.cognitoUser.id;
    }
    
    // Check for guest user
    if (req.guestUserId) {
      return req.guestUserId;
    }
    
    return undefined;
}