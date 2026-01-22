import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { StockCard } from "@/components/StockCard";
import { PortfolioChart } from "@/components/PortfolioChart";
import { AddStockForm } from "@/components/AddStockForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Stock {
  ticker: string;
  companyName: string;
  price: number;
  changePercent: number;
  shares: number;
  purchasePrice?: string;
  purchaseDate?: string;
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

  const { data: stocks, isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  const { data: portfolioStats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/portfolio/overview"],
  });

  const { data: portfolioCharts, isLoading: chartsLoading } = useQuery<StockChartData[]>({
    queryKey: ["/api/portfolio/charts"],
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
              {stocks.map((stock: Stock) => (
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
