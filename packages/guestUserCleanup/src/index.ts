import { db, users } from "@stocker/db";
import UsersDrizzleRepository from "@stocker/repositories/drizzle/user.drizzle";
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Lambda handler for cleaning up expired guest users
 * Triggered by EventBridge (weekly schedule)
 * 
 * Deletes expired guest users from both Cognito and the database.
 * Uses batching for efficiency:
 * - Database: Single batch delete operation
 * - Cognito: Parallel processing in chunks with rate limiting (25 RPS limit)
 */
export async function handler(): Promise<void> {
    console.log("Starting guest user cleanup...");

    try {
        // Validate environment variables
        if (!process.env.COGNITO_USER_POOL_ID) {
            throw new Error("COGNITO_USER_POOL_ID environment variable must be set");
        }
        if (!process.env.AWS_REGION) {
            throw new Error("AWS_REGION environment variable must be set");
        }

        // Initialize services
        const usersRepository = new UsersDrizzleRepository();
        const cognitoClient = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION,
        });

        // Query expired guest users
        console.log("Querying expired guest users...");
        const expiredUsers = await usersRepository.getExpiredGuestUsers();

        if (expiredUsers.length === 0) {
            console.log("No expired guest users found");
            return;
        }

        console.log(`Found ${expiredUsers.length} expired guest users`);

        // Extract user IDs for batch operations
        const expiredUserIds = expiredUsers.map(user => user.id);

        // Step 1: Delete from database first (batch operation)
        console.log("Deleting expired users from database...");
        await db
            .delete(users)
            .where(and(
                eq(users.role, "guest"),
                inArray(users.id, expiredUserIds)
            ));
        
        console.log(`✓ Deleted ${expiredUserIds.length} users from database`);

        // Step 2: Delete from Cognito in batches with rate limiting
        console.log("Deleting expired users from Cognito...");
        const COGNITO_RATE_LIMIT = 25; // requests per second
        const CHUNK_SIZE = 20; // Process 20 at a time to stay under limit
        const DELAY_MS = 100; // 100ms delay between chunks

        let successCount = 0;
        let failureCount = 0;

        // Process in chunks
        for (let i = 0; i < expiredUserIds.length; i += CHUNK_SIZE) {
            const chunk = expiredUserIds.slice(i, i + CHUNK_SIZE);
            const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
            const totalChunks = Math.ceil(expiredUserIds.length / CHUNK_SIZE);

            console.log(`Processing Cognito deletion chunk ${chunkNumber}/${totalChunks} (${chunk.length} users)...`);

            // Process chunk in parallel
            const results = await Promise.allSettled(
                chunk.map(userId =>
                    cognitoClient.send(
                        new AdminDeleteUserCommand({
                            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
                            Username: userId, // userId is the Cognito sub
                        })
                    )
                )
            );

            // Count successes and failures
            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    successCount++;
                } else {
                    failureCount++;
                    const userId = chunk[index];
                    // Log error but continue - user may already be deleted
                    console.warn(`Failed to delete user ${userId} from Cognito:`, result.reason?.message || result.reason);
                }
            });

            // Add delay between chunks to respect rate limit (except for last chunk)
            if (i + CHUNK_SIZE < expiredUserIds.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        console.log(`✓ Cognito deletion complete: ${successCount} successful, ${failureCount} failed`);

        // Summary
        console.log(`✅ Guest user cleanup complete!`);
        console.log(`   - Total expired users: ${expiredUsers.length}`);
        console.log(`   - Database deletions: ${expiredUserIds.length}`);
        console.log(`   - Cognito deletions: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
        console.error("❌ Error in guest user cleanup:", error);
        throw error;
    }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
    handler().catch(console.error);
}

