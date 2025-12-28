import { Holding } from "server/src/domain/stock";
import { DbHolding, DbInsertHolding } from "server/src/infra/db/schema/holdings.schema";

export default interface HoldingsRepository {
    getHoldingsByUserId(userId: string): Promise<Holding[]>;
    insertHolding(holding: DbInsertHolding): Promise<Holding>;
    deleteHolding(userId: string, ticker: string): Promise<void>;
    toDomainHolding(db: DbHolding): Holding;
}