import { CognitoJwtVerifier } from "aws-jwt-verify";

// TODO: to remove bc this logic was moved to api gateway
export const cognitoJwtVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID!,
});