import { Holding } from "server/src/domain/stock";
import HoldingsRepository from "../../interfaces/stock/holdings.repository";
import { DbHolding, DbInsertHolding, holdings } from "server/src/infra/db/schema/holdings.schema";
import { db } from "server/src/infra/db/db";
import { and, eq } from "drizzle-orm";

export default class HoldingsDrizzleRepository implements HoldingsRepository {
    async getHoldingsByUserId(userId: string): Promise<Holding[]> {
        const dbHoldings: DbHolding[] = await db.select().from(holdings).where(eq(holdings.userId, userId));
        return dbHoldings.map(this.toDomainHolding);
    }

    async insertHolding(holding: DbInsertHolding): Promise<Holding> {
        const [dbHolding] = await db.insert(holdings).values(holding).returning();
        return this.toDomainHolding(dbHolding);
    }

    async deleteHolding(userId: string, ticker: string): Promise<void> {
        await db.delete(holdings).where(and(eq(holdings.userId, userId), eq(holdings.ticker, ticker)));
    }

    toDomainHolding(db: DbHolding): Holding {
        return {
            userId: db.userId,
            ticker: db.ticker,
            shares: db.shares,
            purchasePrice: parseFloat(db.purchasePrice),
            purchaseDate: new Date(db.purchaseDate),
        };
    }
}