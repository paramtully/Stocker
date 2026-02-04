import NewsBucketRepository, { NewsErrorManifest } from "./newsBucket.repository";
import { BucketExternalService, BucketS3 } from "@stocker/infra/external/bucket";
import NewsArticle from "@stocker/domain/news/newsArticle";
import NewsSummary from "@stocker/domain/news/newsSummary";
// @ts-expect-error - parquet-wasm types may not be available until package is installed
import initWasm, { readParquet, writeParquet } from "parquet-wasm";
// @ts-expect-error - apache-arrow types may not be available until package is installed
import { Table as ArrowTable, tableFromArrays } from "apache-arrow";

export default class NewsBucketS3ParquetRepository implements NewsBucketRepository {
    private bucketService: BucketExternalService;
    private readonly rawRootKey: string = `news/raw`;
    private readonly processedRootKey: string = `news/processed`;
    private readonly rawYearKey: string = `${this.rawRootKey}/year/`;
    private readonly processedYearKey: string = `${this.processedRootKey}/year/`;
    private readonly errorKey: string = `errors/news/`;
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

    async saveRawHistoricalArticles(articles: NewsArticle[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

            if (articles.length === 0) {
                return;
            }

            // Group articles by year
            const articlesByYear = new Map<number, NewsArticle[]>();
            for (const article of articles) {
                if (!article.publishDate || isNaN(article.publishDate.getTime())) {
                    throw new Error(`Invalid publishDate in article with URL ${article.url}`);
                }
                const year = article.publishDate.getFullYear();
                if (!articlesByYear.has(year)) {
                    articlesByYear.set(year, []);
                }
                articlesByYear.get(year)!.push(article);
            }

            // Save each year as a separate parquet file
            for (const [year, yearArticles] of articlesByYear) {
                try {
                    const key = `${this.rawYearKey}${year}.parquet`;
                    const parquetBuffer = await this.articlesToParquet(yearArticles);
                    await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
                } catch (error) {
                    throw new Error(`Failed to save raw historical articles for year ${year}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("Failed to")) {
                throw error;
            }
            throw new Error(`Error saving raw historical articles: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getRawHistoricalArticles(): Promise<NewsArticle[] | null> {
        try {
            await this.ensureWasmInitialized();

            // List all year parquet files
            const keys = await this.bucketService.listObjects(this.rawYearKey);
            const parquetKeys = keys.filter(key => key.endsWith('.parquet'));

            if (parquetKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allArticles: NewsArticle[] = [];
            const errors: string[] = [];

            for (const key of parquetKeys) {
                try {
                    const buffer = await this.bucketService.getObjectBuffer(key);
                    if (buffer) {
                        if (buffer.length === 0) {
                            console.warn(`Empty parquet file found: ${key}`);
                            continue;
                        }
                        const articles = await this.parquetToArticles(buffer);
                        allArticles.push(...articles);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read parquet file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allArticles.length === 0) {
                // If all files failed, return null
                console.error("All historical raw article parquet files failed to read:", errors);
                return null;
            }

            return allArticles.length > 0 ? allArticles : null;
        } catch (error) {
            console.error("Error reading historical raw articles from parquet:", error);
            return null;
        }
    }

    async saveProcessedHistoricalSummaries(summaries: NewsSummary[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

            if (summaries.length === 0) {
                return;
            }

            // Group summaries by year
            const summariesByYear = new Map<number, NewsSummary[]>();
            for (const summary of summaries) {
                if (!summary.publishDate || isNaN(summary.publishDate.getTime())) {
                    throw new Error(`Invalid publishDate in summary with URL ${summary.articleUrl}`);
                }
                const year = summary.publishDate.getFullYear();
                if (!summariesByYear.has(year)) {
                    summariesByYear.set(year, []);
                }
                summariesByYear.get(year)!.push(summary);
            }

            // Save each year as a separate parquet file
            for (const [year, yearSummaries] of summariesByYear) {
                try {
                    const key = `${this.processedYearKey}${year}.parquet`;
                    const parquetBuffer = await this.summariesToParquet(yearSummaries);
                    await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
                } catch (error) {
                    throw new Error(`Failed to save processed historical summaries for year ${year}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("Failed to")) {
                throw error;
            }
            throw new Error(`Error saving processed historical summaries: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getProcessedHistoricalSummaries(): Promise<NewsSummary[] | null> {
        try {
            await this.ensureWasmInitialized();

            // List all year parquet files
            const keys = await this.bucketService.listObjects(this.processedYearKey);
            const parquetKeys = keys.filter(key => key.endsWith('.parquet'));

            if (parquetKeys.length === 0) {
                return null;
            }

            // Read all year files and combine
            const allSummaries: NewsSummary[] = [];
            const errors: string[] = [];

            for (const key of parquetKeys) {
                try {
                    const buffer = await this.bucketService.getObjectBuffer(key);
                    if (buffer) {
                        if (buffer.length === 0) {
                            console.warn(`Empty parquet file found: ${key}`);
                            continue;
                        }
                        const summaries = await this.parquetToSummaries(buffer);
                        allSummaries.push(...summaries);
                    }
                } catch (error) {
                    const errorMsg = `Failed to read parquet file ${key}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                    // Continue processing other files even if one fails
                }
            }

            if (errors.length > 0 && allSummaries.length === 0) {
                // If all files failed, return null
                console.error("All historical processed summary parquet files failed to read:", errors);
                return null;
            }

            return allSummaries.length > 0 ? allSummaries : null;
        } catch (error) {
            console.error("Error reading historical processed summaries from parquet:", error);
            return null;
        }
    }

    async saveRawDailyArticles(date: Date, articles: NewsArticle[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

            if (!date || isNaN(date.getTime())) {
                throw new Error("Invalid date provided for saveRawDailyArticles");
            }

            const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
            const key = `${this.rawRootKey}/daily/${dateStr}_articles.parquet`;

            const parquetBuffer = await this.articlesToParquet(articles);
            await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
        } catch (error) {
            throw new Error(`Error saving raw daily articles for ${date.toISOString().split("T")[0]}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getRawDailyArticles(date: Date): Promise<NewsArticle[] | null> {
        await this.ensureWasmInitialized();

        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.rawRootKey}/daily/${dateStr}_articles.parquet`;

        try {
            const buffer = await this.bucketService.getObjectBuffer(key);
            if (!buffer) {
                return null;
            }
            return await this.parquetToArticles(buffer);
        } catch (error) {
            console.error(`Error reading raw daily articles from parquet for ${dateStr}:`, error);
            return null;
        }
    }

    async saveProcessedDailySummaries(date: Date, summaries: NewsSummary[]): Promise<void> {
        try {
            await this.ensureWasmInitialized();

            if (!date || isNaN(date.getTime())) {
                throw new Error("Invalid date provided for saveProcessedDailySummaries");
            }

            const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
            const key = `${this.processedRootKey}/daily/${dateStr}_summaries.parquet`;

            const parquetBuffer = await this.summariesToParquet(summaries);
            await this.bucketService.putObject(key, parquetBuffer, "application/x-parquet");
        } catch (error) {
            throw new Error(`Error saving processed daily summaries for ${date.toISOString().split("T")[0]}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getProcessedDailySummaries(date: Date): Promise<NewsSummary[] | null> {
        await this.ensureWasmInitialized();

        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${this.processedRootKey}/daily/${dateStr}_summaries.parquet`;

        try {
            const buffer = await this.bucketService.getObjectBuffer(key);
            if (!buffer) {
                return null;
            }
            return await this.parquetToSummaries(buffer);
        } catch (error) {
            console.error(`Error reading processed daily summaries from parquet for ${dateStr}:`, error);
            return null;
        }
    }

    private async articlesToParquet(articles: NewsArticle[]): Promise<Buffer> {
        if (articles.length === 0) {
            throw new Error("Cannot create parquet file from empty article array");
        }

        // Prepare arrays for Arrow table
        const tickers: string[] = [];
        const titles: string[] = [];
        const urls: string[] = [];
        const sources: string[] = [];
        const publishDates: number[] = []; // Store as milliseconds since epoch
        const summaries: string[] = [];

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];

            // Validate article data
            if (!article.ticker || typeof article.ticker !== 'string') {
                throw new Error(`Invalid ticker at index ${i}: ${article.ticker}`);
            }
            if (!article.title || typeof article.title !== 'string') {
                throw new Error(`Invalid title at index ${i} for URL ${article.url}`);
            }
            if (!article.url || typeof article.url !== 'string') {
                throw new Error(`Invalid URL at index ${i}`);
            }
            if (!article.source || typeof article.source !== 'string') {
                throw new Error(`Invalid source at index ${i} for URL ${article.url}`);
            }
            if (!article.publishDate || isNaN(article.publishDate.getTime())) {
                throw new Error(`Invalid publishDate at index ${i} for URL ${article.url}`);
            }
            if (typeof article.summary !== 'string') {
                throw new Error(`Invalid summary at index ${i} for URL ${article.url}`);
            }

            tickers.push(article.ticker);
            titles.push(article.title);
            urls.push(article.url);
            sources.push(article.source);
            publishDates.push(article.publishDate.getTime());
            summaries.push(article.summary);
        }

        try {
            // Create Arrow table
            const table = tableFromArrays({
                ticker: tickers,
                title: titles,
                url: urls,
                source: sources,
                publishDate: publishDates,
                summary: summaries,
            });

            // Write to parquet format
            const parquetUint8Array = writeParquet(table, {
                compression: "snappy",
                writeStatistics: true,
            });

            return Buffer.from(parquetUint8Array);
        } catch (error) {
            throw new Error(`Failed to convert articles to parquet format: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async parquetToArticles(buffer: Buffer): Promise<NewsArticle[]> {
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

            // Convert Arrow table to NewsArticle[]
            const articles: NewsArticle[] = [];
            const numRows = arrowTable.numRows;

            if (numRows === 0) {
                return articles;
            }

            // Get column data
            const tickerCol = arrowTable.getChild("ticker");
            const titleCol = arrowTable.getChild("title");
            const urlCol = arrowTable.getChild("url");
            const sourceCol = arrowTable.getChild("source");
            const publishDateCol = arrowTable.getChild("publishDate");
            const summaryCol = arrowTable.getChild("summary");

            const missingColumns: string[] = [];
            if (!tickerCol) missingColumns.push("ticker");
            if (!titleCol) missingColumns.push("title");
            if (!urlCol) missingColumns.push("url");
            if (!sourceCol) missingColumns.push("source");
            if (!publishDateCol) missingColumns.push("publishDate");
            if (!summaryCol) missingColumns.push("summary");

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns in parquet file: ${missingColumns.join(", ")}`);
            }

            // Extract values from Arrow columns
            for (let i = 0; i < numRows; i++) {
                try {
                    const ticker = tickerCol.get(i);
                    const title = titleCol.get(i);
                    const url = urlCol.get(i);
                    const source = sourceCol.get(i);
                    const publishDateMs = publishDateCol.get(i);
                    const summary = summaryCol.get(i);

                    // Validate extracted values
                    if (typeof ticker !== 'string' || !ticker) {
                        console.warn(`Invalid ticker at row ${i}, skipping`);
                        continue;
                    }
                    if (typeof title !== 'string' || !title) {
                        console.warn(`Invalid title at row ${i} for URL ${url}, skipping`);
                        continue;
                    }
                    if (typeof url !== 'string' || !url) {
                        console.warn(`Invalid URL at row ${i}, skipping`);
                        continue;
                    }
                    if (typeof source !== 'string' || !source) {
                        console.warn(`Invalid source at row ${i} for URL ${url}, skipping`);
                        continue;
                    }
                    if (typeof publishDateMs !== 'number' || isNaN(publishDateMs)) {
                        console.warn(`Invalid publishDate at row ${i} for URL ${url}, skipping`);
                        continue;
                    }
                    if (typeof summary !== 'string') {
                        console.warn(`Invalid summary at row ${i} for URL ${url}, skipping`);
                        continue;
                    }

                    const publishDate = new Date(publishDateMs);
                    if (isNaN(publishDate.getTime())) {
                        console.warn(`Invalid publishDate value at row ${i} for URL ${url}, skipping`);
                        continue;
                    }

                    articles.push({
                        ticker,
                        title,
                        url,
                        source,
                        publishDate,
                        summary,
                    });
                } catch (rowError) {
                    console.warn(`Error processing row ${i}: ${rowError instanceof Error ? rowError.message : String(rowError)}, skipping`);
                    // Continue processing other rows
                }
            }

            return articles;
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

    private async summariesToParquet(summaries: NewsSummary[]): Promise<Buffer> {
        if (summaries.length === 0) {
            throw new Error("Cannot create parquet file from empty summary array");
        }

        // Prepare arrays for Arrow table
        const tickers: string[] = [];
        const sources: string[] = [];
        const headlines: string[] = [];
        const articleUrls: string[] = [];
        const publishDates: number[] = []; // Store as milliseconds since epoch
        const summaryTexts: string[] = [];
        const impactAnalyses: string[] = []; // JSON-encoded arrays
        const recommendedActions: string[] = []; // JSON-encoded arrays
        const sentiments: string[] = [];

        for (let i = 0; i < summaries.length; i++) {
            const summary = summaries[i];

            // Validate summary data
            if (!summary.ticker || typeof summary.ticker !== 'string') {
                throw new Error(`Invalid ticker at index ${i}: ${summary.ticker}`);
            }
            if (!summary.source || typeof summary.source !== 'string') {
                throw new Error(`Invalid source at index ${i} for URL ${summary.articleUrl}`);
            }
            if (!summary.headline || typeof summary.headline !== 'string') {
                throw new Error(`Invalid headline at index ${i} for URL ${summary.articleUrl}`);
            }
            if (!summary.articleUrl || typeof summary.articleUrl !== 'string') {
                throw new Error(`Invalid articleUrl at index ${i}`);
            }
            if (!summary.publishDate || isNaN(summary.publishDate.getTime())) {
                throw new Error(`Invalid publishDate at index ${i} for URL ${summary.articleUrl}`);
            }
            if (typeof summary.summary !== 'string') {
                throw new Error(`Invalid summary at index ${i} for URL ${summary.articleUrl}`);
            }
            if (!Array.isArray(summary.impactAnalysis)) {
                throw new Error(`Invalid impactAnalysis at index ${i} for URL ${summary.articleUrl}`);
            }
            if (!Array.isArray(summary.recommendedActions)) {
                throw new Error(`Invalid recommendedActions at index ${i} for URL ${summary.articleUrl}`);
            }
            if (!summary.sentiment || !['positive', 'negative', 'neutral'].includes(summary.sentiment)) {
                throw new Error(`Invalid sentiment at index ${i} for URL ${summary.articleUrl}`);
            }

            tickers.push(summary.ticker);
            sources.push(summary.source);
            headlines.push(summary.headline);
            articleUrls.push(summary.articleUrl);
            publishDates.push(summary.publishDate.getTime());
            summaryTexts.push(summary.summary);
            impactAnalyses.push(JSON.stringify(summary.impactAnalysis));
            recommendedActions.push(JSON.stringify(summary.recommendedActions));
            sentiments.push(summary.sentiment);
        }

        try {
            // Create Arrow table
            const table = tableFromArrays({
                ticker: tickers,
                source: sources,
                headline: headlines,
                articleUrl: articleUrls,
                publishDate: publishDates,
                summary: summaryTexts,
                impactAnalysis: impactAnalyses,
                recommendedActions: recommendedActions,
                sentiment: sentiments,
            });

            // Write to parquet format
            const parquetUint8Array = writeParquet(table, {
                compression: "snappy",
                writeStatistics: true,
            });

            return Buffer.from(parquetUint8Array);
        } catch (error) {
            throw new Error(`Failed to convert summaries to parquet format: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async parquetToSummaries(buffer: Buffer): Promise<NewsSummary[]> {
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

            // Convert Arrow table to NewsSummary[]
            const summaries: NewsSummary[] = [];
            const numRows = arrowTable.numRows;

            if (numRows === 0) {
                return summaries;
            }

            // Get column data
            const tickerCol = arrowTable.getChild("ticker");
            const sourceCol = arrowTable.getChild("source");
            const headlineCol = arrowTable.getChild("headline");
            const articleUrlCol = arrowTable.getChild("articleUrl");
            const publishDateCol = arrowTable.getChild("publishDate");
            const summaryCol = arrowTable.getChild("summary");
            const impactAnalysisCol = arrowTable.getChild("impactAnalysis");
            const recommendedActionsCol = arrowTable.getChild("recommendedActions");
            const sentimentCol = arrowTable.getChild("sentiment");

            const missingColumns: string[] = [];
            if (!tickerCol) missingColumns.push("ticker");
            if (!sourceCol) missingColumns.push("source");
            if (!headlineCol) missingColumns.push("headline");
            if (!articleUrlCol) missingColumns.push("articleUrl");
            if (!publishDateCol) missingColumns.push("publishDate");
            if (!summaryCol) missingColumns.push("summary");
            if (!impactAnalysisCol) missingColumns.push("impactAnalysis");
            if (!recommendedActionsCol) missingColumns.push("recommendedActions");
            if (!sentimentCol) missingColumns.push("sentiment");

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns in parquet file: ${missingColumns.join(", ")}`);
            }

            // Extract values from Arrow columns
            for (let i = 0; i < numRows; i++) {
                try {
                    const ticker = tickerCol.get(i);
                    const source = sourceCol.get(i);
                    const headline = headlineCol.get(i);
                    const articleUrl = articleUrlCol.get(i);
                    const publishDateMs = publishDateCol.get(i);
                    const summaryText = summaryCol.get(i);
                    const impactAnalysisJson = impactAnalysisCol.get(i);
                    const recommendedActionsJson = recommendedActionsCol.get(i);
                    const sentiment = sentimentCol.get(i);

                    // Validate extracted values
                    if (typeof ticker !== 'string' || !ticker) {
                        console.warn(`Invalid ticker at row ${i}, skipping`);
                        continue;
                    }
                    if (typeof source !== 'string' || !source) {
                        console.warn(`Invalid source at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof headline !== 'string' || !headline) {
                        console.warn(`Invalid headline at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof articleUrl !== 'string' || !articleUrl) {
                        console.warn(`Invalid articleUrl at row ${i}, skipping`);
                        continue;
                    }
                    if (typeof publishDateMs !== 'number' || isNaN(publishDateMs)) {
                        console.warn(`Invalid publishDate at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof summaryText !== 'string') {
                        console.warn(`Invalid summary at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof impactAnalysisJson !== 'string') {
                        console.warn(`Invalid impactAnalysis at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof recommendedActionsJson !== 'string') {
                        console.warn(`Invalid recommendedActions at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }
                    if (typeof sentiment !== 'string' || !['positive', 'negative', 'neutral'].includes(sentiment)) {
                        console.warn(`Invalid sentiment at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }

                    // Parse JSON arrays
                    let impactAnalysis: string[];
                    let recommendedActions: string[];
                    try {
                        impactAnalysis = JSON.parse(impactAnalysisJson);
                        if (!Array.isArray(impactAnalysis)) {
                            throw new Error("impactAnalysis is not an array");
                        }
                    } catch (parseError) {
                        console.warn(`Failed to parse impactAnalysis at row ${i} for URL ${articleUrl}: ${parseError instanceof Error ? parseError.message : String(parseError)}, using empty array`);
                        impactAnalysis = [];
                    }

                    try {
                        recommendedActions = JSON.parse(recommendedActionsJson);
                        if (!Array.isArray(recommendedActions)) {
                            throw new Error("recommendedActions is not an array");
                        }
                    } catch (parseError) {
                        console.warn(`Failed to parse recommendedActions at row ${i} for URL ${articleUrl}: ${parseError instanceof Error ? parseError.message : String(parseError)}, using empty array`);
                        recommendedActions = [];
                    }

                    const publishDate = new Date(publishDateMs);
                    if (isNaN(publishDate.getTime())) {
                        console.warn(`Invalid publishDate value at row ${i} for URL ${articleUrl}, skipping`);
                        continue;
                    }

                    summaries.push({
                        ticker,
                        source,
                        headline,
                        articleUrl,
                        publishDate,
                        summary: summaryText,
                        impactAnalysis,
                        recommendedActions,
                        sentiment: sentiment as "positive" | "negative" | "neutral",
                    });
                } catch (rowError) {
                    console.warn(`Error processing row ${i}: ${rowError instanceof Error ? rowError.message : String(rowError)}, skipping`);
                    // Continue processing other rows
                }
            }

            return summaries;
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

    async updateYearFileWithRawArticles(year: number, articles: NewsArticle[]): Promise<void> {
        await this.ensureWasmInitialized();

        if (articles.length === 0) {
            return;
        }

        const yearKey = `${this.rawYearKey}${year}.parquet`;

        // Read existing year file
        let existingArticles: NewsArticle[] = [];
        try {
            const buffer = await this.bucketService.getObjectBuffer(yearKey);
            if (buffer && buffer.length > 0) {
                existingArticles = await this.parquetToArticles(buffer);
            }
        } catch {
            // File doesn't exist yet (first day of year), that's okay
            console.log(`Year file ${year} doesn't exist yet, creating new file`);
        }

        // Create a map of existing articles by URL for efficient lookup
        const existingMap = new Map<string, NewsArticle>();
        for (const article of existingArticles) {
            existingMap.set(article.url, article);
        }

        // Merge: remove existing articles for URLs in new articles, then add new ones
        for (const article of articles) {
            existingMap.set(article.url, article); // Overwrites if exists
        }

        // Convert back to array and sort by date
        const mergedArticles = Array.from(existingMap.values());
        mergedArticles.sort((a, b) => a.publishDate.getTime() - b.publishDate.getTime());

        // Write updated year file
        const parquetBuffer = await this.articlesToParquet(mergedArticles);
        await this.bucketService.putObject(yearKey, parquetBuffer, "application/x-parquet");
    }

    async updateYearFileWithSummaries(year: number, summaries: NewsSummary[]): Promise<void> {
        await this.ensureWasmInitialized();

        if (summaries.length === 0) {
            return;
        }

        const yearKey = `${this.processedYearKey}${year}.parquet`;

        // Read existing year file
        let existingSummaries: NewsSummary[] = [];
        try {
            const buffer = await this.bucketService.getObjectBuffer(yearKey);
            if (buffer && buffer.length > 0) {
                existingSummaries = await this.parquetToSummaries(buffer);
            }
        } catch {
            // File doesn't exist yet (first day of year), that's okay
            console.log(`Year file ${year} doesn't exist yet, creating new file`);
        }

        // Create a map of existing summaries by articleUrl for efficient lookup
        const existingMap = new Map<string, NewsSummary>();
        for (const summary of existingSummaries) {
            existingMap.set(summary.articleUrl, summary);
        }

        // Merge: remove existing summaries for URLs in new summaries, then add new ones
        for (const summary of summaries) {
            existingMap.set(summary.articleUrl, summary); // Overwrites if exists
        }

        // Convert back to array and sort by date
        const mergedSummaries = Array.from(existingMap.values());
        mergedSummaries.sort((a, b) => a.publishDate.getTime() - b.publishDate.getTime());

        // Write updated year file
        const parquetBuffer = await this.summariesToParquet(mergedSummaries);
        await this.bucketService.putObject(yearKey, parquetBuffer, "application/x-parquet");
    }

    async getRawArticlesForDateRange(startDate: Date, endDate: Date): Promise<NewsArticle[]> {
        await this.ensureWasmInitialized();

        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const allArticles: NewsArticle[] = [];

        // Read all year files in range
        for (let year = startYear; year <= endYear; year++) {
            const yearKey = `${this.rawYearKey}${year}.parquet`;
            try {
                const buffer = await this.bucketService.getObjectBuffer(yearKey);
                if (buffer && buffer.length > 0) {
                    const yearArticles = await this.parquetToArticles(buffer);
                    // Filter to date range
                    const filtered = yearArticles.filter(a => {
                        const articleDate = new Date(a.publishDate);
                        articleDate.setHours(0, 0, 0, 0);
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        return articleDate >= start && articleDate <= end;
                    });
                    allArticles.push(...filtered);
                }
            } catch {
                // Year file doesn't exist, skip it
            }
        }

        return allArticles;
    }

    async getSummariesForDateRange(startDate: Date, endDate: Date): Promise<NewsSummary[]> {
        await this.ensureWasmInitialized();

        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const allSummaries: NewsSummary[] = [];

        // Read all year files in range
        for (let year = startYear; year <= endYear; year++) {
            const yearKey = `${this.processedYearKey}${year}.parquet`;
            try {
                const buffer = await this.bucketService.getObjectBuffer(yearKey);
                if (buffer && buffer.length > 0) {
                    const yearSummaries = await this.parquetToSummaries(buffer);
                    // Filter to date range
                    const filtered = yearSummaries.filter(s => {
                        const summaryDate = new Date(s.publishDate);
                        summaryDate.setHours(0, 0, 0, 0);
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        return summaryDate >= start && summaryDate <= end;
                    });
                    allSummaries.push(...filtered);
                }
            } catch {
                // Year file doesn't exist, skip it
            }
        }

        return allSummaries;
    }

    async getErrorManifest(date: Date, dataType: 'raw' | 'summarization'): Promise<NewsErrorManifest | null> {
        const dateStr = date.toISOString().split("T")[0];
        const key = `${this.errorKey}${dataType}/${dateStr}-errors.json`;

        try {
            const data = await this.bucketService.getObject(key);
            if (!data) return null;
            return JSON.parse(data) as NewsErrorManifest;
        } catch {
            return null;
        }
    }

    async saveErrorManifest(manifest: NewsErrorManifest): Promise<void> {
        const dataType = manifest.dataType === 'news-raw' ? 'raw' : 'summarization';
        const key = `${this.errorKey}${dataType}/${manifest.date}-errors.json`;
        const data = JSON.stringify(manifest, null, 2);
        await this.bucketService.putObject(key, data, "application/json");
    }
}

