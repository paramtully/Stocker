import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { StockCard } from "@/components/StockCard";
import { PortfolioChart } from "@/components/PortfolioChart";
import { AddStockForm } from "@/components/AddStockForm";
import { Skeleton } from "@/components/ui/skeleton";

// Types matching backend domain types
interface Quote {
  ticker: string;
  companyName: string;
  price: number;
  changePercent: number;
  shares: number;
  purchasePrice: number;
  purchaseDate: Date;
}

interface PortfolioStats {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  stockCount: number;
}

interface DataPoint {
  date: string;
  price: number;
}

interface ChartDataSet {
  "1D": DataPoint[];
  "1W": DataPoint[];
  "1M": DataPoint[];
  "1Y": DataPoint[];
  "5Y": DataPoint[];
  "ALL": DataPoint[];
}

interface StockChartData {
  ticker: string;
  companyName: string;
  data: ChartDataSet;
}

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const { data: stocks, isLoading: stocksLoading } = useQuery<Quote[]>({
    queryKey: ["/api/portfolio/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/quotes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const data = await res.json();
      // Parse purchaseDate from string to Date
      return data.map((quote: Omit<Quote, "purchaseDate"> & { purchaseDate: string }) => ({
        ...quote,
        purchaseDate: new Date(quote.purchaseDate),
      }));
    },
  });

  const { data: portfolioStats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/portfolio/overview"],
  });

  // Backend returns Record<string, Record<ChartPeriod, Candle[]>>
  // Transform to StockChartData[] format for chart components
  const { data: portfolioCharts, isLoading: chartsLoading } = useQuery<StockChartData[]>({
    queryKey: ["/api/portfolio/charts"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/charts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch charts");
      const chartsData: Record<string, Record<string, Array<{
        ticker: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        date: string; // Date serialized as string in JSON
      }>>> = await res.json();
      
      // Transform to array format
      return Object.entries(chartsData).map(([ticker, periods]) => {
        const stock = stocks?.find(s => s.ticker === ticker);
        const chartDataSet: ChartDataSet = {
          "1D": (periods["1D"] || []).map(c => ({ date: c.date, price: c.close })),
          "1W": (periods["1W"] || []).map(c => ({ date: c.date, price: c.close })),
          "1M": (periods["1M"] || []).map(c => ({ date: c.date, price: c.close })),
          "1Y": (periods["1Y"] || []).map(c => ({ date: c.date, price: c.close })),
          "5Y": (periods["5Y"] || []).map(c => ({ date: c.date, price: c.close })),
          "ALL": (periods["ALL"] || []).map(c => ({ date: c.date, price: c.close })),
        };
        return {
          ticker,
          companyName: stock?.companyName || ticker,
          data: chartDataSet,
        };
      });
    },
    enabled: !!stocks,
  });

  const handleStockChange = (ticker: string) => {
    // Clear selection if the changed stock was selected
    if (selectedTicker === ticker) {
      setSelectedTicker(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : portfolioStats ? (
        <PortfolioOverview
          totalValue={portfolioStats.totalValue}
          dailyChange={portfolioStats.dailyChange}
          dailyChangePercent={portfolioStats.dailyChangePercent}
          totalGain={portfolioStats.totalGain}
          totalGainPercent={portfolioStats.totalGainPercent}
        />
      ) : null}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {chartsLoading ? (
            <Skeleton className="h-96" />
          ) : portfolioCharts && portfolioCharts.length > 0 ? (
            <PortfolioChart
              stocks={portfolioCharts}
              selectedTicker={selectedTicker}
              onSelectTicker={setSelectedTicker}
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Add stocks to your portfolio to view charts
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-4">Your Portfolio</h2>
          {stocksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : stocks && stocks.length > 0 ? (
            <div className="space-y-3">
              {stocks.map((stock: Quote) => (
                <StockCard
                  key={stock.ticker}
                  ticker={stock.ticker}
                  companyName={stock.companyName}
                  price={stock.price}
                  changePercent={stock.changePercent}
                  shares={stock.shares}
                  isSelected={selectedTicker === stock.ticker}
                  onClick={() => setSelectedTicker(selectedTicker === stock.ticker ? null : stock.ticker)}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              No stocks in portfolio. Add some below!
            </div>
          )}
        </div>
      </div>

      <AddStockForm
        onAddStock={handleStockChange}
        onRemoveStock={handleStockChange}
      />
    </div>
  );
}
