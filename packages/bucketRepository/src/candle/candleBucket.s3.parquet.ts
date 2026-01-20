import CandleBucketRepository from "./candleBucket.repository";
import { BucketExternalService, BucketS3 } from "@stocker/infra/external/bucket";
import Candle from "@stocker/domain/stock/candle";
// @ts-expect-error - parquet-wasm types may not be available until package is installed
import initWasm, { readParquet, writeParquet } from "parquet-wasm";
// @ts-expect-error - apache-arrow types may not be available until package is installed
import { Table as ArrowTable, tableFromArrays } from "apache-arrow";

export default class CandleBucketS3ParquetRepository implements CandleBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rootKey: string = `candles/`;
    private readonly yearKey: string = `${this.rootKey}year/`;
    private readonly dailyKey: string = `${this.rootKey}daily/`;
    private wasmInitialized: boolean = false;

    constructor() {
        this.bucketService = new BucketS3();
    }

    private async ensureWasmInitialized(): Promise<void> {
        if (!this.wasmInitialized) {
            try {
                await initWasm();
                this.wasmInitialized = true;
            } catch (error) {
                throw new Error(`Failed to initialize parquet-wasm: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    async saveHistoricalCandles(candles: Candle[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

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

            // Save each year as a separate parquet file
            for (const [year, yearCandles] of candlesByYear) {
                try {
                    const key = `${this.yearKey}${year}.parquet`;
                    const parquetBuffer = await this.candlesToParquet(yearCandles);
                    await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
                } catch (error) {
                    throw new Error(`Failed to save historical candles for year ${year}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("Failed to")) {
                throw error;
            }
            throw new Error(`Error saving historical candles: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getHistoricalCandles(): Promise<Candle[] | null> {
        try {
            await this.ensureWasmInitialized();

            // List all year parquet files
            const keys = await this.bucketService.listObjects(this.yearKey);
            const parquetKeys = keys.filter(key => key.endsWith('.parquet'));

            if (parquetKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allCandles: Candle[] = [];
            const errors: string[] = [];

            for (const key of parquetKeys) {
                try {
                    const buffer = await this.bucketService.getObjectBuffer(key);
                    if (buffer) {
                        if (buffer.length === 0) {
                            console.warn(`Empty parquet file found: ${key}`);
                            continue;
                        }
                        const candles = await this.parquetToCandles(buffer);
                        allCandles.push(...candles);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read parquet file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allCandles.length === 0) {
                // If all files failed, return null
                console.error("All historical parquet files failed to read:", errors);
                return null;
            }

            return allCandles.length > 0 ? allCandles : null;
        } catch (error) {
            console.error("Error reading historical candles from parquet:", error);
            return null;
        }
    }

    async saveDailyCandles(date: Date, candles: Candle[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

            if (!date || isNaN(date.getTime())) {
                throw new Error("Invalid date provided for saveDailyCandles");
            }

            const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
            const key = `${this.dailyKey}${dateStr}_candles.parquet`;

            const parquetBuffer = await this.candlesToParquet(candles);
            await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
        } catch (error) {
            throw new Error(`Error saving daily candles for ${date.toISOString().split("T")[0]}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getDailyCandles(date: Date): Promise<Candle[] | null> {
        await this.ensureWasmInitialized();

        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.dailyKey}${dateStr}_candles.parquet`;

        try {
            const buffer = await this.bucketService.getObjectBuffer(key);
            if (!buffer) {
                return null;
            }
            return await this.parquetToCandles(buffer);
        } catch (error) {
            console.error(`Error reading daily candles from parquet for ${dateStr}:`, error);
            return null;
        }
    }

    private async candlesToParquet(candles: Candle[]): Promise<Buffer> {
        if (candles.length === 0) {
            throw new Error("Cannot create parquet file from empty candle array");
        }

        // Prepare arrays for Arrow table
        const tickers: string[] = [];
        const opens: number[] = [];
        const highs: number[] = [];
        const lows: number[] = [];
        const closes: number[] = [];
        const volumes: number[] = [];
        const dates: number[] = []; // Store as milliseconds since epoch

        for (let i = 0; i < candles.length; i++) {
            const candle = candles[i];

            // Validate candle data
            if (!candle.ticker || typeof candle.ticker !== 'string') {
                throw new Error(`Invalid ticker at index ${i}: ${candle.ticker}`);
            }
            if (typeof candle.open !== 'number' || isNaN(candle.open)) {
                throw new Error(`Invalid open price at index ${i} for ticker ${candle.ticker}`);
            }
            if (typeof candle.high !== 'number' || isNaN(candle.high)) {
                throw new Error(`Invalid high price at index ${i} for ticker ${candle.ticker}`);
            }
            if (typeof candle.low !== 'number' || isNaN(candle.low)) {
                throw new Error(`Invalid low price at index ${i} for ticker ${candle.ticker}`);
            }
            if (typeof candle.close !== 'number' || isNaN(candle.close)) {
                throw new Error(`Invalid close price at index ${i} for ticker ${candle.ticker}`);
            }
            if (typeof candle.volume !== 'number' || isNaN(candle.volume)) {
                throw new Error(`Invalid volume at index ${i} for ticker ${candle.ticker}`);
            }
            if (!candle.date || isNaN(candle.date.getTime())) {
                throw new Error(`Invalid date at index ${i} for ticker ${candle.ticker}`);
            }

            tickers.push(candle.ticker);
            opens.push(candle.open);
            highs.push(candle.high);
            lows.push(candle.low);
            closes.push(candle.close);
            volumes.push(candle.volume);
            dates.push(candle.date.getTime());
        }

        try {
            // Create Arrow table
            const table = tableFromArrays({
                ticker: tickers,
                open: opens,
                high: highs,
                low: lows,
                close: closes,
                volume: volumes,
                date: dates,
            });

            // Write to parquet format
            const parquetUint8Array = writeParquet(table, {
                compression: "snappy",
                writeStatistics: true,
            });

            return Buffer.from(parquetUint8Array);
        } catch (error) {
            throw new Error(`Failed to convert candles to parquet format: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async parquetToCandles(buffer: Buffer): Promise<Candle[]> {
        if (!buffer || buffer.length === 0) {
            throw new Error("Cannot parse empty parquet buffer");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let wasmTable: any = null;
        try {
            // Read parquet file
            wasmTable = readParquet(buffer);

            if (!wasmTable) {
                throw new Error("Failed to read parquet file - readParquet returned null");
            }

            // Convert WASM table to Arrow table
            const ipcBuffer = wasmTable.intoIPCStream();
            const arrowTable = ArrowTable.from(ipcBuffer);

            // Clean up WASM memory
            wasmTable.drop();
            wasmTable = null;

            // Convert Arrow table to Candle[]
            const candles: Candle[] = [];
            const numRows = arrowTable.numRows;

            if (numRows === 0) {
                return candles;
            }

            // Get column data
            const tickerCol = arrowTable.getChild("ticker");
            const openCol = arrowTable.getChild("open");
            const highCol = arrowTable.getChild("high");
            const lowCol = arrowTable.getChild("low");
            const closeCol = arrowTable.getChild("close");
            const volumeCol = arrowTable.getChild("volume");
            const dateCol = arrowTable.getChild("date");

            const missingColumns: string[] = [];
            if (!tickerCol) missingColumns.push("ticker");
            if (!openCol) missingColumns.push("open");
            if (!highCol) missingColumns.push("high");
            if (!lowCol) missingColumns.push("low");
            if (!closeCol) missingColumns.push("close");
            if (!volumeCol) missingColumns.push("volume");
            if (!dateCol) missingColumns.push("date");

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns in parquet file: ${missingColumns.join(", ")}`);
            }

            // Extract values from Arrow columns
            for (let i = 0; i < numRows; i++) {
                try {
                    const ticker = tickerCol.get(i);
                    const open = openCol.get(i);
                    const high = highCol.get(i);
                    const low = lowCol.get(i);
                    const close = closeCol.get(i);
                    const volume = volumeCol.get(i);
                    const dateMs = dateCol.get(i);

                    // Validate extracted values
                    if (typeof ticker !== 'string' || !ticker) {
                        console.warn(`Invalid ticker at row ${i}, skipping`);
                        continue;
                    }
                    if (typeof open !== 'number' || isNaN(open)) {
                        console.warn(`Invalid open price at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }
                    if (typeof high !== 'number' || isNaN(high)) {
                        console.warn(`Invalid high price at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }
                    if (typeof low !== 'number' || isNaN(low)) {
                        console.warn(`Invalid low price at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }
                    if (typeof close !== 'number' || isNaN(close)) {
                        console.warn(`Invalid close price at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }
                    if (typeof volume !== 'number' || isNaN(volume)) {
                        console.warn(`Invalid volume at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }
                    if (typeof dateMs !== 'number' || isNaN(dateMs)) {
                        console.warn(`Invalid date at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }

                    const date = new Date(dateMs);
                    if (isNaN(date.getTime())) {
                        console.warn(`Invalid date value at row ${i} for ticker ${ticker}, skipping`);
                        continue;
                    }

                    candles.push({
                        ticker,
                        open,
                        high,
                        low,
                        close,
                        volume,
                        date,
                    });
                } catch (rowError) {
                    console.warn(`Error processing row ${i}: ${rowError instanceof Error ? rowError.message : String(rowError)}, skipping`);
                    // Continue processing other rows
                }
            }

            return candles;
        } catch (error) {
            // Ensure WASM memory is cleaned up even on error
            if (wasmTable) {
                try {
                    wasmTable.drop();
                } catch {
                    // Ignore drop errors during cleanup
                }
            }

            if (error instanceof Error && error.message.includes("Missing required columns")) {
                throw error;
            }
            throw new Error(`Failed to parse parquet file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

