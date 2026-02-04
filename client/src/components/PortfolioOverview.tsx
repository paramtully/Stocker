import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

interface PortfolioOverviewProps {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
}

export function PortfolioOverview({
  totalValue,
  dailyChange,
  dailyChangePercent,
  totalGain,
  totalGainPercent,
}: PortfolioOverviewProps) {
  const isDailyPositive = dailyChange >= 0;
  const isTotalPositive = totalGain >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card data-testid="card-portfolio-value">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Portfolio Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold" data-testid="text-total-value">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-daily-change">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Change
          </CardTitle>
          {isDailyPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-mono font-bold ${
              isDailyPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
            data-testid="text-daily-change"
          >
            {isDailyPositive ? "+" : ""}${dailyChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-sm font-mono ${
            isDailyPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {isDailyPositive ? "+" : ""}{dailyChangePercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-total-gain">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Gain/Loss
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-mono font-bold ${
              isTotalPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
            data-testid="text-total-gain"
          >
            {isTotalPositive ? "+" : ""}${totalGain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-sm font-mono ${
            isTotalPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {isTotalPositive ? "+" : ""}{totalGainPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-stocks-count">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Stocks in Portfolio
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold">5</div>
          <p className="text-sm text-muted-foreground">Active positions</p>
        </CardContent>
      </Card>
    </div>
  );
}
