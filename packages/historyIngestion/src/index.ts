import { StocksRepository } from "@stocker/repositories/interfaces/stock";
import { StocksDrizzleRepository } from "@stocker/repositories/drizzle/stock";
import { populateHistoricalCandles } from "./fetchHistoricalCandles";
import { populateHistoricalNews } from "./fetchNews";

async function main() {
    console.log("Starting data populator...");
    
    try {
        // Get all stocks
        const stockRepository: StocksRepository = new StocksDrizzleRepository();
        const stocks = await stockRepository.getStocks();
        const tickers = stocks.map(stock => stock.ticker);
        
        console.log(`Found ${tickers.length} stocks to populate`);
        
        if (tickers.length === 0) {
            console.log("No stocks found in database. Please add stocks first.");
            process.exit(1);
        }
        
        // Populate historical candles
        console.log("\n=== Populating Historical Candles ===");
        await populateHistoricalCandles(tickers);
        
        // Populate historical news
        console.log("\n=== Populating Historical News ===");
        await populateHistoricalNews();
        
        console.log("\n✅ Data population complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in data populator:", error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

