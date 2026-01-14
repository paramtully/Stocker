import CandleBucketRepository from "./candleBucket.repository";
import { BucketExternalService, BucketS3 } from "@stocker/infra/external/bucket";
import { Candle } from "@stocker/domain/stock/candle";

export default class CandleBucketS3Repository implements CandleBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rootKey: string = `candles/`;
    private readonly historicalKey: string = `${this.rootKey}/historical/historical.json`;
    private readonly dailyKey: string = `${this.rootKey}/daily`;

    constructor() {
        this.bucketService = new BucketS3();
    }

    async saveHistoricalCandles(candles: Candle[]): Promise<void> {
        const data = JSON.stringify(candles, this.dateReplacer);
        await this.bucketService.putObject(this.historicalKey, data, "application/json");
    }

    async getHistoricalCandles(): Promise<Candle[] | null> {
        const data = await this.bucketService.getObject(this.historicalKey);
        if (!data) {
            return null;
        }
        return JSON.parse(data, this.dateReviver) as Candle[];
    }

    async saveDailyCandles(date: Date, candles: Candle[]): Promise<void> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.dailyKey}/${dateStr}_candles.json`;
        const data = JSON.stringify(candles, this.dateReplacer);
        await this.bucketService.putObject(key, data, "application/json");
    }


    async getDailyCandles(date: Date): Promise<Candle[] | null> {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.dailyKey}/${dateStr}_candles.json`;
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

