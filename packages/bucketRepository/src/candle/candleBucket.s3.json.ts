import CandleBucketRepository from "./candleBucket.repository";
import { BucketExternalService, BucketS3 } from "@stocker/infra/external/bucket";
import Candle from "@stocker/domain/stock/candle";

export default class CandleBucketS3Repository implements CandleBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rootKey: string = `candles/`;
    private readonly yearKey: string = `${this.rootKey}year/`;
    private readonly dailyKey: string = `${this.rootKey}daily/`;

    constructor() {
        this.bucketService = new BucketS3();
    }

    async saveHistoricalCandles(candles: Candle[]): Promise<void> {
        if (candles.length === 0) {
            return;
        }

        // Group candles by year
        const candlesByYear = new Map<number, Candle[]>();
        for (const candle of candles) {
            if (!candle.date || isNaN(candle.date.getTime())) {
                throw new Error(`Invalid date in candle for ticker ${candle.ticker}`);
            }
            const year = candle.date.getFullYear();
            if (!candlesByYear.has(year)) {
                candlesByYear.set(year, []);
            }
            candlesByYear.get(year)!.push(candle);
        }

        // Save each year as a separate JSON file
        for (const [year, yearCandles] of candlesByYear) {
            const key = `${this.yearKey}${year}.json`;
            const data = JSON.stringify(yearCandles, this.dateReplacer);
            await this.bucketService.putObject(key, data, "application/json");
        }
    }

    async getHistoricalCandles(): Promise<Candle[] | null> {
        try {
            // List all year JSON files
            const keys = await this.bucketService.listObjects(this.yearKey);
            const jsonKeys = keys.filter(key => key.endsWith('.json'));

            if (jsonKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allCandles: Candle[] = [];
            const errors: string[] = [];

            for (const key of jsonKeys) {
                try {
                    const data = await this.bucketService.getObject(key);
                    if (data) {
                        const candles = JSON.parse(data, this.dateReviver) as Candle[];
                        allCandles.push(...candles);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read JSON file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allCandles.length === 0) {
                // If all files failed, return null
                console.error("All historical JSON files failed to read:", errors);
                return null;
            }

            return allCandles.length > 0 ? allCandles : null;
        } catch (error) {
            console.error("Error reading historical candles from JSON:", error);
            return null;
        }
    }

    async saveDailyCandles(date: Date, candles: Candle[]): Promise<void> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.dailyKey}${dateStr}_candles.json`;
        const data = JSON.stringify(candles, this.dateReplacer);
        await this.bucketService.putObject(key, data, "application/json");
    }

    async getDailyCandles(date: Date): Promise<Candle[] | null> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.dailyKey}${dateStr}_candles.json`;
        const data = await this.bucketService.getObject(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as Candle[];
    }

    private dateReplacer(_key: string, value: unknown): unknown {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }

    private dateReviver(_key: string, value: unknown): unknown {
        // Check if value is a date string (ISO format)
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
        }
        return value;
    }
}

