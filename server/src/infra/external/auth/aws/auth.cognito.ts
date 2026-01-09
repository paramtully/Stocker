import { UserRole } from "server/src/domain/user";
import AuthExternalService from "../auth.external";
import { AdminCreateUserCommand, AdminInitiateAuthCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { v4 as uuid } from "uuid";
import { Request } from "express";

interface RequestWithCognitoClaims extends Request {
    APIGatewayProxyEvent: {
        requestContext: {
            authorizer: {
                claims: CognitoJWTClaims;
            };
        };
    };
}

type CognitoJWTClaims = {
    sub: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    email_verified?: boolean;
    "custom:role": UserRole;
    "cognito:username"?: string;
}

export default class AuthCognitoClient implements AuthExternalService {
    private client: CognitoIdentityProviderClient;
    private cognitoJwtVerifier;

    constructor() {
        this.client = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION!,
        });
        this.cognitoJwtVerifier = CognitoJwtVerifier.create({
            userPoolId: process.env.COGNITO_USER_POOL_ID!,
            tokenUse: "id",
            clientId: process.env.COGNITO_CLIENT_ID!,
        });
    }

    async verifyToken(header: string): Promise<{id: string, username: string | undefined, email?: string, role: UserRole} | undefined> {
        const token = header.slice(7);
        const payload = await this.cognitoJwtVerifier.verify(token);

        if (!payload) {
            throw new Error("Failed to verify token");
        }
        return {
            id: payload.sub,
            username: payload.email as string || payload["cognito:username"] as string || undefined,
            email: payload.email as string || undefined,
            role: payload["custom:role"] as UserRole,
        };
    }

    async addUser(username: string, role: string, password?: string): Promise<{id: string, password: string}> {
        const tempPassword = password ?? uuid();
        const createRes = await this.client.send(new AdminCreateUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: username,
            TemporaryPassword: tempPassword, // never exposed
            MessageAction: "SUPPRESS",
            UserAttributes: [
                { Name: "custom:role", Value: role },
            ],
        }));
        return {
            id: createRes.User?.Attributes?.find(
                a => a.Name === "sub"
                )?.Value as string,
            password: tempPassword,
        };
    }

    async initiateAuth(username: string, password: string): Promise<{ accessToken: string, idToken: string, expiresIn: number }> {
        const authRes = await this.client.send(new AdminInitiateAuthCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        }));

        return {
            accessToken: authRes.AuthenticationResult?.AccessToken as string,
            idToken: authRes.AuthenticationResult?.IdToken as string,
            expiresIn: authRes.AuthenticationResult?.ExpiresIn as number,
        };
    }

    async getUserFromRequest(req: Request, isIntercepted: boolean=false): Promise<{id: string, username?: string, email?: string, role: UserRole} | undefined> {
        if (!isIntercepted) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                return await this.verifyToken(authHeader.slice(7));
            }
            return undefined;
        }
        
        const claims: CognitoJWTClaims = (req as RequestWithCognitoClaims).APIGatewayProxyEvent?.requestContext?.authorizer?.claims as CognitoJWTClaims;
        return claims ? {
            id: claims.sub,
            username: claims.email || claims["cognito:username"], // Fallback to username
            email: claims.email,
            role: claims["custom:role"],
        } : undefined;
    }
}