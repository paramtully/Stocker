import { Holding } from "packages/domain/src/portfolio";
import HoldingsRepository from "../../interfaces/portfolio/holdings.repository";
import { DbHolding, DbInsertHolding, holdings } from "../../../../db/src/schema/holdings.schema";
import { db } from "../../../../db/src/db";
import { and, eq } from "drizzle-orm";

export default class HoldingsDrizzleRepository implements HoldingsRepository {

    async getUserHoldings(userId: string): Promise<Holding[]> {
        const dbHoldings: DbHolding[] = await db.select().from(holdings).where(eq(holdings.userId, userId));
        return dbHoldings.map(this.toDomainHolding);
    }

    async insertHolding(holding: Holding): Promise<void> {
        await db.insert(holdings).values(this.toDbInsertHolding(holding));
    }

    async deleteHolding(userId: string, ticker: string): Promise<void> {
        await db.delete(holdings).where(and(eq(holdings.userId, userId), eq(holdings.ticker, ticker)));
    }

    toDomainHolding(dbHolding: DbHolding): Holding {
        return {
            userId: dbHolding.userId,
            ticker: dbHolding.ticker,
            shares: dbHolding.shares,
            purchasePrice: parseFloat(dbHolding.purchasePrice),
            purchaseDate: new Date(dbHolding.purchaseDate),
        };
    }

    toDbInsertHolding(holding: Holding): DbInsertHolding {
        return {
            userId: holding.userId,
            ticker: holding.ticker,
            shares: holding.shares,
            purchasePrice: holding.purchasePrice.toString(),
            purchaseDate: holding.purchaseDate.toISOString().split("T")[0], // Convert Date to 'YYYY-MM-DD' string
        };
    }
}