import { cognito } from "../aws/cognito";
import { db } from "../db";

export async function cleanupExpiredGuests() {
  const expiredGuests = await db.query(`
    SELECT cognito_sub
    FROM users
    WHERE user_type = 'guest'
      AND expires_at < now()
  `);

  for (const user of expiredGuests) {
    try {
      await cognito.adminDeleteUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: user.cognito_sub
      });
    } catch (err) {
      // user may already be gone — safe to ignore/log
    }
  }

  await db.query(`
    DELETE FROM users
    WHERE user_type = 'guest'
      AND expires_at < now()
  `);
}
