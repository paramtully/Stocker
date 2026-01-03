// server/cognitoAuth.ts
import type { Express, Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { storage } from "./storage";

// Environment variables required:
// COGNITO_USER_POOL_ID - e.g., "us-east-1_xxxxx"
// COGNITO_CLIENT_ID - App client ID
// COGNITO_DOMAIN - e.g., "your-app.auth.us-east-1.amazoncognito.com"
// COGNITO_REDIRECT_URI - e.g., "https://your-app.com/api/callback"
// Initialize JWT verifier (cached automatically)
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});
// Prefetch JWKS for faster first verification
verifier.hydrate().catch(console.error);
export function setupAuth(app: Express) {
  // Trust proxy for secure cookies behind load balancer
  app.set("trust proxy", 1);
  
  // Cookie parser for guest sessions
  app.use(cookieParser());
  // Login - redirect to Cognito Hosted UI
  app.get("/api/login", (req: Request, res: Response) => {
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const redirectUri = process.env.COGNITO_REDIRECT_URI || `https://${req.hostname}/api/callback`;
    
    const loginUrl = new URL(`https://${domain}/login`);
    loginUrl.searchParams.set("client_id", clientId!);
    loginUrl.searchParams.set("response_type", "code");
    loginUrl.searchParams.set("scope", "openid email profile");
    loginUrl.searchParams.set("redirect_uri", redirectUri);
    
    res.redirect(loginUrl.toString());
  });
  // Callback - exchange code for tokens
  app.get("/api/callback", async (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      console.error("Cognito auth error:", error);
      return res.redirect("/?error=auth_failed");
    }
    
    if (!code) {
      return res.redirect("/?error=no_code");
    }
    
    try {
      const domain = process.env.COGNITO_DOMAIN;
      const clientId = process.env.COGNITO_CLIENT_ID;
      const clientSecret = process.env.COGNITO_CLIENT_SECRET; // Optional
      const redirectUri = process.env.COGNITO_REDIRECT_URI || `https://${req.hostname}/api/callback`;
      
      // Exchange code for tokens
      const tokenUrl = `https://${domain}/oauth2/token`;
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId!,
        code: code as string,
        redirect_uri: redirectUri,
      });
      
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      
      // Add client secret if configured (for confidential clients)
      if (clientSecret) {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
      }
      
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body: params,
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        return res.redirect("/?error=token_exchange_failed");
      }
      
      const tokens = await tokenResponse.json();
      
      // Verify and decode the ID token
      const payload = await verifier.verify(tokens.id_token);
      
      // Upsert user in database
      await storage.upsertUser({
        id: payload.sub,
        email: payload.email as string | undefined,
        firstName: payload.given_name as string | undefined,
        lastName: payload.family_name as string | undefined,
        profileImageUrl: payload.picture as string | undefined,
        isGuest: false,
      });
      
      // Clear guest cookie if it exists (user is now authenticated)
      res.clearCookie("guestId");
      
      // Return tokens to frontend via redirect with hash fragment
      // Frontend will store these in memory/localStorage
      const redirectUrl = new URL("/", `https://${req.hostname}`);
      redirectUrl.hash = `id_token=${tokens.id_token}&access_token=${tokens.access_token}&expires_in=${tokens.expires_in}`;
      
      res.redirect(redirectUrl.toString());
    } catch (err) {
      console.error("Callback error:", err);
      res.redirect("/?error=callback_failed");
    }
  });
  // Logout - redirect to Cognito logout endpoint
  app.get("/api/logout", (req: Request, res: Response) => {
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const logoutUri = `https://${req.hostname}`;
    
    // Clear guest cookie
    res.clearCookie("guestId");
    
    const logoutUrl = new URL(`https://${domain}/logout`);
    logoutUrl.searchParams.set("client_id", clientId!);
    logoutUrl.searchParams.set("logout_uri", logoutUri);
    
    res.redirect(logoutUrl.toString());
  });
  // Get current user info
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      return res.json(null);
    }
    
    try {
      const token = authHeader.slice(7);
      const payload = await verifier.verify(token);
      
      const user = await storage.getUser(payload.sub);
      res.json(user);
    } catch (err) {
      res.json(null);
    }
  });
  // Check auth status
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const hasToken = !!req.headers.authorization?.startsWith("Bearer ");
    const guestId = req.cookies?.guestId;
    
    res.json({
      isAuthenticated: hasToken,
      isGuest: !hasToken && !!guestId,
      hasSession: hasToken || !!guestId,
    });
  });
}