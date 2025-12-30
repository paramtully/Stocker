import { type Holding } from "server/src/domain/portfolio";
import { DbHolding, DbInsertHolding } from "server/src/infra/db/schema/holdings.schema";

export default interface HoldingsRepository {
    getUserHoldings(userId: string): Promise<Holding[]>;
    insertHolding(holding: Holding): Promise<void>;
    deleteHolding(userId: string, ticker: string): Promise<void>;
    toDomainHolding(dbHolding: DbHolding): Holding;
    toDbInsertHolding(holding: Holding): DbInsertHolding;
}