import { Holding } from "../domain/stock";
import { DbHolding } from "../infra/db/schema";

export function toDomainHolding(db: DbHolding): Holding {
    return {
        userId: db.userId,
        ticker: db.ticker,
        shares: db.shares,
        purchasePrice: parseFloat(db.purchasePrice),
        purchaseDate: new Date(db.purchaseDate),
    };
}