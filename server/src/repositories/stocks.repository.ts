import { Stock } from "../domain/stock";
import { DbStock } from "../infra/db/schema";

export function toDomainStock(db: DbStock): Stock {
    return {
        ticker: db.ticker,
        companyName: db.companyName,  
        dayChangePercent: parseFloat(db.dayChangePercent),
    };
}