/**
 * Market Calendar Utility
 * Determines trading days (excludes weekends and market holidays)
 */

export class MarketCalendar {
    // Known US market holidays (simplified - can be enhanced with a library like 'market-holidays')
    // Format: "YYYY-MM-DD"
    private static readonly MARKET_HOLIDAYS = new Set<string>([
        // New Year's Day
        "2024-01-01", "2025-01-01", "2026-01-01",
        // Martin Luther King Jr. Day (3rd Monday of January)
        "2024-01-15", "2025-01-20", "2026-01-19",
        // Presidents' Day (3rd Monday of February)
        "2024-02-19", "2025-02-17", "2026-02-16",
        // Good Friday
        "2024-03-29", "2025-04-18", "2026-04-03",
        // Memorial Day (last Monday of May)
        "2024-05-27", "2025-05-26", "2026-05-25",
        // Juneteenth
        "2024-06-19", "2025-06-19", "2026-06-19",
        // Independence Day
        "2024-07-04", "2025-07-04", "2026-07-04",
        // Labor Day (1st Monday of September)
        "2024-09-02", "2025-09-01", "2026-09-07",
        // Thanksgiving (4th Thursday of November)
        "2024-11-28", "2025-11-27", "2026-11-26",
        // Christmas
        "2024-12-25", "2025-12-25", "2026-12-25",
    ]);

    /**
     * Check if a date is a trading day (not weekend, not holiday)
     */
    static isTradingDay(date: Date): boolean {
        const dayOfWeek = date.getDay();
        
        // Weekend check (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }

        // Holiday check
        const dateStr = date.toISOString().split("T")[0];
        if (this.MARKET_HOLIDAYS.has(dateStr)) {
            return false;
        }

        return true;
    }

    /**
     * Get all trading days in a date range
     */
    static getTradingDays(startDate: Date, endDate: Date): Date[] {
        const tradingDays: Date[] = [];
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        while (current <= end) {
            if (this.isTradingDay(current)) {
                tradingDays.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return tradingDays;
    }

    /**
     * Get the previous trading day
     */
    static getPreviousTradingDay(date: Date): Date {
        const previous = new Date(date);
        previous.setDate(previous.getDate() - 1);
        previous.setHours(0, 0, 0, 0);

        while (!this.isTradingDay(previous)) {
            previous.setDate(previous.getDate() - 1);
        }

        return previous;
    }

    /**
     * Get the next trading day
     */
    static getNextTradingDay(date: Date): Date {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);

        while (!this.isTradingDay(next)) {
            next.setDate(next.getDate() + 1);
        }

        return next;
    }

    /**
     * Check if today is a trading day
     */
    static isTodayTradingDay(): boolean {
        return this.isTradingDay(new Date());
    }
}

