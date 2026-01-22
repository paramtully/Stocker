import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO, isAfter, isBefore } from "date-fns";

interface DataPoint {
  date: string;
  price: number;
}

interface StockChartProps {
  ticker: string;
  companyName: string;
  data: {
    "1D": DataPoint[];
    "1W": DataPoint[];
    "1M": DataPoint[];
    "1Y": DataPoint[];
    "5Y": DataPoint[];
    "ALL": DataPoint[];
  };
  purchaseDate?: string;
  purchasePrice?: string;
}

const timePeriods = ["1D", "1W", "1M", "1Y", "5Y", "ALL"] as const;
type TimePeriod = typeof timePeriods[number];

export function StockChart({ ticker, companyName, data, purchaseDate, purchasePrice }: StockChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");

  const chartData = data[selectedPeriod];
  const startPrice = chartData[0]?.price || 0;
  const endPrice = chartData[chartData.length - 1]?.price || 0;
  const isPositive = endPrice >= startPrice;

  const purchaseDateFormatted = purchaseDate 
    ? format(parseISO(purchaseDate), "MMM d")
    : null;
  
  const showPurchaseLine = purchaseDateFormatted && 
    chartData.some(d => d.date === purchaseDateFormatted);

  const purchasePriceNum = purchasePrice ? parseFloat(purchasePrice) : null;
  const gainSincePurchase = purchasePriceNum 
    ? ((endPrice - purchasePriceNum) / purchasePriceNum) * 100 
    : null;

  return (
    <Card data-testid="card-stock-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">{companyName}</CardTitle>
          <p className="text-sm text-muted-foreground font-mono">{ticker}</p>
          {purchaseDate && purchasePriceNum && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                Bought: {format(parseISO(purchaseDate), "MMM d, yyyy")}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                @ ${purchasePriceNum.toFixed(2)}
              </Badge>
              {gainSincePurchase !== null && (
                <Badge 
                  variant={gainSincePurchase >= 0 ? "default" : "destructive"}
                  className="font-mono text-xs"
                >
                  {gainSincePurchase >= 0 ? "+" : ""}{gainSincePurchase.toFixed(2)}% since purchase
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
              className="font-mono"
            >
              {period}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground font-mono"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground font-mono"
                domain={["auto", "auto"]}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
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
              {purchasePriceNum && (
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
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
