import { Request } from "express";
import { UserRole } from "packages/domain/src/user";

// Extend Request type
export interface RequestWithCognitoUser extends Request {
    cognitoUser?: { sub: string; email?: string };
}

export interface RequestWithClaims extends Request {
    APIGatewayProxyEvent: {
        requestContext: {
            authorizer: {
                claims: JWTClaims;
            };
        };
    };
}

export type JWTClaims = {
    sub: string;
    email: string;
    given_name: string;
    family_name: string;
    email_verified: boolean;
    "custom:role": UserRole;
}