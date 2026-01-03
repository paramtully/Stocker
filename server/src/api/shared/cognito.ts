import { CognitoJwtVerifier } from "aws-jwt-verify";

export const cognitoJwtVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID!,
});