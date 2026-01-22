import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface StockInfo {
  ticker: string;
  companyName: string;
  data: ChartDataSet;
}

interface PortfolioChartProps {
  stocks: StockInfo[];
  selectedTicker: string | null;
  onSelectTicker: (ticker: string | null) => void;
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

export function PortfolioChart({ stocks, selectedTicker, onSelectTicker }: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");

  const displayStocks = selectedTicker 
    ? stocks.filter(s => s.ticker === selectedTicker)
    : stocks;

  if (displayStocks.length === 0) {
    return (
      <Card data-testid="card-portfolio-chart">
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          No stocks in portfolio to display
        </CardContent>
      </Card>
    );
  }

  const mergedData = mergeChartData(displayStocks, selectedPeriod);

  return (
    <Card data-testid="card-portfolio-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <CardTitle className="text-xl font-semibold">
            {selectedTicker ? displayStocks[0]?.companyName : "Portfolio Performance"}
          </CardTitle>
          <Select
            value={selectedTicker || "all"}
            onValueChange={(value) => onSelectTicker(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-40" data-testid="select-ticker">
              <SelectValue placeholder="Select ticker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-item-all">All Tickers</SelectItem>
              {stocks.map((stock) => (
                <SelectItem 
                  key={stock.ticker} 
                  value={stock.ticker}
                  data-testid={`select-item-${stock.ticker}`}
                >
                  {stock.ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
      </CardContent>
    </Card>
  );
}

function mergeChartData(stocks: StockInfo[], period: TimePeriod): Record<string, any>[] {
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
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "1W":
      case "1M":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "1Y":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      case "5Y":
      case "ALL":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {
    return dateStr;
  }
}
