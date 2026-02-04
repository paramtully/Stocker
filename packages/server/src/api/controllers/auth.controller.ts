import { Request, Response } from "express";
import { AuthService, IAuthService } from "server/src/services/auth/";
import { AuthExternalService, AuthCognitoClient } from "server/src/infra/external/auth/aws";
import { RequestWithUser } from "../shared/RequestWithUser";
import getUserId from "../shared/getUser";
import { z } from "zod";
import { db } from "../../../db/src/db";
import { users } from "../../../db/src/schema";
import { eq } from "drizzle-orm";

const authService: IAuthService = new AuthService();
const authExternalService: AuthExternalService = new AuthCognitoClient();

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

export const authController = {
    getUser: async (req: Request, res: Response) => {
        try {
            const userId = getUserId(req);
            const user = await authService.getUserById(userId!);
            return res.json(user);
        } catch (error) {
            console.error("Error getting user:", error);
            return res.status(500).json({ error: "Failed to get user" });
        }
    },

    signup: async (req: Request, res: Response) => {
        try {
            // Validate request body
            const validationResult = signupSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    error: "Invalid request",
                    details: validationResult.error.errors
                });
            }

            const { email, password, firstName, lastName } = validationResult.data;

            // Check if email is already taken (non-guest user)
            const existingUser = await authService.getUserByEmail(email);
            if (existingUser && existingUser.role !== "guest") {
                return res.status(409).json({ error: "Email already registered" });
            }

            // Get current user from request (should be a guest if token provided)
            const currentUser = (req as RequestWithUser).user;

            if (!currentUser || currentUser.role !== "guest") {
                // If no guest user, create a new user instead
                // This handles the case where someone signs up without being a guest first
                const username = email;
                const newUser = await authExternalService.addUser(username, "user", password);

                // Update Cognito user with email
                await authExternalService.updateUserEmail(username, email);

                // Insert into database
                await authService.insertUser({
                    id: newUser.id,
                    email: email,
                    name: firstName && lastName ? { first: firstName, last: lastName } : undefined,
                    role: "user",
                    emailPreferences: {
                        enabled: true,
                        deliveryHour: 8,
                    },
                });

                // Get tokens
                const tokens = await authExternalService.initiateAuth(username, password);
                res.setHeader("Authorization", `Bearer ${tokens.accessToken}`);
                return res.status(201).json({
                    message: "User created successfully",
                    user: {
                        id: newUser.id,
                        email: email,
                        role: "user",
                    }
                });
            }

            // Convert guest user to full user
            const cognitoUsername = currentUser.username!;

            // Update Cognito user
            await authExternalService.updateUserEmail(cognitoUsername, email);
            await authExternalService.setUserPassword(cognitoUsername, password);
            await authExternalService.updateUserRole(cognitoUsername, "user");

            // Update database
            await authService.updateUserEmail(currentUser.id, email);
            await authService.updateUserRole(currentUser.id, "user");

            // Update name if provided
            if (firstName || lastName) {
                await db.update(users)
                    .set({
                        firstName: firstName || null,
                        lastName: lastName || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, currentUser.id));
            }

            // Get new tokens with updated user
            const tokens = await authExternalService.initiateAuth(cognitoUsername, password);
            res.setHeader("Authorization", `Bearer ${tokens.accessToken}`);

            return res.status(200).json({
                message: "Account upgraded successfully",
                user: {
                    id: currentUser.id,
                    email: email,
                    role: "user",
                }
            });

        } catch (error) {
            console.error("Error during signup:", error);
            return res.status(500).json({ error: "Failed to create account" });
        }
    },
};