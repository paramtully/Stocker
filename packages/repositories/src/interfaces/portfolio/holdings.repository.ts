import { type Holding } from "packages/domain/src/portfolio";
import { DbHolding, DbInsertHolding } from "../../../../db/src/schema/holdings.schema";

export default interface HoldingsRepository {
    getUserHoldings(userId: string): Promise<Holding[]>;
    insertHolding(holding: Holding): Promise<void>;
    deleteHolding(userId: string, ticker: string): Promise<void>;
    toDomainHolding(dbHolding: DbHolding): Holding;
    toDbInsertHolding(holding: Holding): DbInsertHolding;
}