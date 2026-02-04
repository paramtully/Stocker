import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

// Backend returns Record<string, Record<ChartPeriod, Candle[]>>
// We'll transform it to this format for the chart components
interface StockChartInfo {
  ticker: string;
  companyName: string;
  data: ChartDataSet;
}

const timePeriods = ["1D", "1W", "1M", "1Y", "5Y", "ALL"] as const;
type TimePeriod = typeof timePeriods[number];

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 87%, 65%)",
  "hsl(190, 90%, 50%)",
  "hsl(330, 80%, 60%)",
  "hsl(60, 70%, 50%)",
];

export default function Performance() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");

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

  // Backend returns Record<string, Record<ChartPeriod, Candle[]>>
  // Transform to StockChartInfo[] format for chart components
  const { data: portfolioCharts, isLoading: chartsLoading } = useQuery<StockChartInfo[]>({
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

  const { data: portfolioOverview, isLoading: overviewLoading } = useQuery<{
    totalValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    totalGain: number;
    totalGainPercent: number;
    stockCount: number;
  }>({
    queryKey: ["/api/portfolio/overview"],
  });


  const selectedStock = selectedTicker ? stocks?.find(s => s.ticker === selectedTicker) : null;

  const displayStocks = selectedTicker 
    ? (portfolioCharts?.filter(s => s.ticker === selectedTicker) || [])
    : (portfolioCharts || []);

  const mergedChartData = mergeChartData(displayStocks, selectedPeriod);

  const calculatePortfolioMetrics = () => {
    if (!stocks || stocks.length === 0) {
      return { totalValue: 0, totalGainLoss: 0, totalGainLossPercent: 0, todayChange: 0, todayChangePercent: 0 };
    }

    let totalValue = 0;
    let totalCost = 0;
    let todayChange = 0;

    stocks.forEach(stock => {
      const shares = stock.shares || 0;
      const currentPrice = stock.price || 0;
      const purchasePrice = stock.purchasePrice ? parseFloat(stock.purchasePrice) : currentPrice;
      
      const stockValue = shares * currentPrice;
      const stockCost = shares * purchasePrice;
      const stockTodayChange = shares * currentPrice * (stock.changePercent / 100);

      totalValue += stockValue;
      totalCost += stockCost;
      todayChange += stockTodayChange;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const todayChangePercent = totalValue > 0 ? (todayChange / (totalValue - todayChange)) * 100 : 0;

    return { totalValue, totalGainLoss, totalGainLossPercent, todayChange, todayChangePercent };
  };

  const calculateStockMetrics = (stock: Quote) => {
    const shares = stock.shares || 0;
    const currentPrice = stock.price || 0;
    const purchasePrice = stock.purchasePrice || currentPrice;
    
    const stockValue = shares * currentPrice;
    const stockCost = shares * purchasePrice;
    const gainLoss = stockValue - stockCost;
    const gainLossPercent = stockCost > 0 ? (gainLoss / stockCost) * 100 : 0;
    const todayChange = shares * currentPrice * (stock.changePercent / 100);

    return { 
      purchasePrice, 
      currentPrice, 
      gainLoss, 
      gainLossPercent, 
      todayChange, 
      todayChangePercent: stock.changePercent 
    };
  };

  const calculatedMetrics = calculatePortfolioMetrics();
  const portfolioMetrics = portfolioOverview 
    ? {
        totalValue: portfolioOverview.totalValue ?? 0,
        totalGainLoss: portfolioOverview.totalGain ?? 0,
        totalGainLossPercent: portfolioOverview.totalGainPercent ?? 0,
        todayChange: portfolioOverview.dailyChange ?? 0,
        todayChangePercent: portfolioOverview.dailyChangePercent ?? 0,
      }
    : calculatedMetrics;

  const isAllStocks = selectedTicker === null;
  const stockMetrics = selectedStock ? calculateStockMetrics(selectedStock) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Performance</h1>
          <p className="text-muted-foreground">
            Analyze historical performance across different time periods
          </p>
        </div>
        {stocksLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <Select 
            value={selectedTicker || "all"} 
            onValueChange={(value) => setSelectedTicker(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-64" data-testid="select-performance-stock">
              <SelectValue placeholder="Select stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-item-all-performance">
                <span className="font-medium">All Stocks</span>
              </SelectItem>
              {stocks?.map((stock) => (
                <SelectItem key={stock.ticker} value={stock.ticker} data-testid={`select-item-${stock.ticker}`}>
                  <span className="font-mono font-medium">{stock.ticker}</span>
                  <span className="ml-2 text-muted-foreground">{stock.companyName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isAllStocks && (
          <Card data-testid="card-portfolio-value">
            <CardContent className="pt-6 overflow-hidden">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span className="text-sm">Portfolio Value</span>
              </div>
              {overviewLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-xl md:text-2xl font-bold font-mono truncate" data-testid="text-portfolio-value">
                  ${portfolioMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-today-change">
          <CardContent className="pt-6 overflow-hidden">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4 shrink-0" />
              <span className="text-sm">Today's Change</span>
            </div>
            {overviewLoading || stocksLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex flex-wrap items-center gap-1 md:gap-2 min-w-0">
                <p className={`text-xl md:text-2xl font-bold font-mono truncate ${
                  (isAllStocks ? portfolioMetrics.todayChange : (stockMetrics?.todayChange ?? 0)) >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`} data-testid="text-today-change">
                  {(isAllStocks ? portfolioMetrics.todayChange : (stockMetrics?.todayChange ?? 0)) >= 0 ? "+" : ""}
                  ${Math.abs(isAllStocks ? portfolioMetrics.todayChange : (stockMetrics?.todayChange ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className={`text-sm font-mono whitespace-nowrap ${
                  (isAllStocks ? portfolioMetrics.todayChangePercent : (stockMetrics?.todayChangePercent ?? 0)) >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  ({(isAllStocks ? portfolioMetrics.todayChangePercent : (stockMetrics?.todayChangePercent ?? 0)) >= 0 ? "+" : ""}
                  {(isAllStocks ? portfolioMetrics.todayChangePercent : (stockMetrics?.todayChangePercent ?? 0)).toFixed(2)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-gain-loss">
          <CardContent className="pt-6 overflow-hidden">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {(isAllStocks ? portfolioMetrics.totalGainLoss : (stockMetrics?.gainLoss ?? 0)) >= 0 ? (
                <TrendingUp className="h-4 w-4 shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" />
              )}
              <span className="text-sm">Total Gain/Loss</span>
            </div>
            {overviewLoading || stocksLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex flex-wrap items-center gap-1 md:gap-2 min-w-0">
                <p className={`text-xl md:text-2xl font-bold font-mono truncate ${
                  (isAllStocks ? portfolioMetrics.totalGainLoss : (stockMetrics?.gainLoss ?? 0)) >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`} data-testid="text-total-gain-loss">
                  {(isAllStocks ? portfolioMetrics.totalGainLoss : (stockMetrics?.gainLoss ?? 0)) >= 0 ? "+" : ""}
                  ${Math.abs(isAllStocks ? portfolioMetrics.totalGainLoss : (stockMetrics?.gainLoss ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className={`text-sm font-mono whitespace-nowrap ${
                  (isAllStocks ? portfolioMetrics.totalGainLossPercent : (stockMetrics?.gainLossPercent ?? 0)) >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  ({(isAllStocks ? portfolioMetrics.totalGainLossPercent : (stockMetrics?.gainLossPercent ?? 0)) >= 0 ? "+" : ""}
                  {(isAllStocks ? portfolioMetrics.totalGainLossPercent : (stockMetrics?.gainLossPercent ?? 0)).toFixed(2)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {!isAllStocks && selectedStock && (
          <Card data-testid="card-price-comparison">
            <CardContent className="pt-6 overflow-hidden">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="text-sm">Price Comparison</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Purchase</p>
                  <p className="text-base md:text-lg font-bold font-mono truncate" data-testid="text-purchase-price">
                    ${(selectedStock.purchasePrice || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-muted-foreground shrink-0">→</div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-base md:text-lg font-bold font-mono truncate" data-testid="text-current-price">
                    ${selectedStock.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card data-testid="card-performance-chart">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-semibold">
              {isAllStocks ? "Portfolio Performance" : selectedStock?.companyName || ""}
            </CardTitle>
            {!isAllStocks && selectedStock?.purchaseDate && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs" data-testid="badge-purchase-date">
                  Bought: {format(selectedStock.purchaseDate, "MMM d, yyyy")}
                </Badge>
                {selectedStock.purchasePrice && (
                  <Badge variant="outline" className="font-mono text-xs" data-testid="badge-purchase-price">
                    @ ${selectedStock.purchasePrice.toFixed(2)}
                  </Badge>
                )}
                {stockMetrics && (
                  <Badge 
                    variant={stockMetrics.gainLossPercent >= 0 ? "default" : "destructive"}
                    className="font-mono text-xs"
                    data-testid="badge-gain-since-purchase"
                  >
                    {stockMetrics.gainLossPercent >= 0 ? "+" : ""}{stockMetrics.gainLossPercent.toFixed(2)}% since purchase
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {timePeriods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                data-testid={`button-period-${period}`}
              >
                {period}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartsLoading ? (
            <Skeleton className="h-80" />
          ) : displayStocks.length > 0 ? (
              (() => {
              const purchaseDateFormatted = !isAllStocks && selectedStock?.purchaseDate 
                ? format(selectedStock.purchaseDate, "MMM d")
                : null;
              const showPurchaseLine = purchaseDateFormatted && 
                mergedChartData.some(d => d.date === purchaseDateFormatted);
              const purchasePriceNum = !isAllStocks && selectedStock?.purchasePrice 
                ? parseFloat(selectedStock.purchasePrice) 
                : null;

              return (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mergedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => formatDateLabel(value, selectedPeriod)}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                      />
                      {showPurchaseLine && (
                        <ReferenceLine
                          x={purchaseDateFormatted}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{
                            value: "Purchased",
                            position: "top",
                            fill: "hsl(var(--primary))",
                            fontSize: 12,
                          }}
                        />
                      )}
                      {purchasePriceNum && !isAllStocks && (
                        <ReferenceLine
                          y={purchasePriceNum}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                          label={{
                            value: `Buy: $${purchasePriceNum.toFixed(2)}`,
                            position: "right",
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 10,
                          }}
                        />
                      )}
                      {displayStocks.length > 1 && (
                        <Legend 
                          wrapperStyle={{ paddingTop: "10px" }}
                        />
                      )}
                      {displayStocks.map((stock, index) => (
                        <Line
                          key={stock.ticker}
                          type="monotone"
                          dataKey={stock.ticker}
                          name={stock.ticker}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          connectNulls={true}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No chart data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Stocks Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stocksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stocks?.map((stock) => {
                const metrics = calculateStockMetrics(stock);
                return (
                  <Card
                    key={stock.ticker}
                    className={`cursor-pointer transition-all hover-elevate ${
                      selectedTicker === stock.ticker ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedTicker(stock.ticker === selectedTicker ? null : stock.ticker)}
                    data-testid={`card-stock-${stock.ticker}`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-lg">{stock.ticker}</span>
                        <span className={`text-sm font-mono ${
                          stock.changePercent >= 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 truncate">{stock.companyName}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Purchase</p>
                          <p className="font-mono font-medium" data-testid={`text-purchase-${stock.ticker}`}>
                            ${(stock.purchasePrice || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="font-mono font-medium" data-testid={`text-current-${stock.ticker}`}>
                            ${stock.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Gain/Loss</span>
                          <span className={`font-mono text-sm font-medium ${
                            metrics.gainLoss >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          }`} data-testid={`text-gain-${stock.ticker}`}>
                            {metrics.gainLoss >= 0 ? "+" : ""}${metrics.gainLoss.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function mergeChartData(stocks: StockChartInfo[], period: TimePeriod): Record<string, any>[] {
  if (stocks.length === 0) return [];

  // Collect all unique dates from all stocks and sort chronologically
  const allDatesSet = new Set<string>();
  stocks.forEach(stock => {
    const data = stock.data[period] || [];
    data.forEach(d => allDatesSet.add(d.date));
  });

  // Sort dates chronologically (ISO format YYYY-MM-DD sorts correctly as strings)
  const sortedDates = Array.from(allDatesSet).sort();

  // Build merged data points
  return sortedDates.map(date => {
    const dataPoint: Record<string, any> = { date };
    stocks.forEach(stock => {
      const stockData = stock.data[period] || [];
      const point = stockData.find(d => d.date === date);
      if (point) {
        dataPoint[stock.ticker] = point.price;
      }
    });
    return dataPoint;
  });
}

function formatDateLabel(dateStr: string, period: TimePeriod): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    switch (period) {
      case "1D":
      case "1W":
      case "1M":
        // Short periods: show month and day
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "1Y":
      case "5Y":
      case "ALL":
        // Longer periods: show month and full year for clarity
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      default:
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {
    return dateStr;
  }
}
