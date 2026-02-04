import { Candle } from "@stocker/domain/stock/candle";

export interface ErrorManifest {
    date: string;
    dataType: 'candles';
    errors: Array<{
        ticker: string;
        date: string;
        error: string;
        retryCount: number;
        timestamp: string;
    }>;
    partialSuccess: Array<{
        ticker: string;
        date: string;
        recordCount: number;
    }>;
}

export default interface CandleBucketRepository {
    saveHistoricalCandles(candles: Candle[]): Promise<void>;
    saveDailyCandles(date: Date, candles: Candle[]): Promise<void>;
    getHistoricalCandles(): Promise<Candle[] | null>;
    getDailyCandles(date: Date): Promise<Candle[] | null>;

    // New methods for year-only file updates
    updateYearFileWithDailyData(year: number, dailyCandles: Candle[]): Promise<void>;
    getCandlesForDateRange(startDate: Date, endDate: Date): Promise<Candle[]>;
    getMissingTradingDays(startDate: Date, endDate: Date, tickers: string[]): Promise<{
        missingDates: Date[];
        missingByTicker: Record<string, Date[]>;
    }>;

    // Error manifest methods
    getErrorManifest(date: Date): Promise<ErrorManifest | null>;
    saveErrorManifest(manifest: ErrorManifest): Promise<void>;
}

