import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockCardProps {
  ticker: string;
  companyName: string;
  price: number;
  changePercent: number;
  shares?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StockCard({
  ticker,
  companyName,
  price,
  changePercent,
  shares,
  isSelected = false,
  onClick,
}: StockCardProps) {
  const isPositive = changePercent >= 0;
  const totalValue = shares ? price * shares : undefined;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-200 hover-elevate ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
      data-testid={`card-stock-${ticker}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono font-semibold text-base" data-testid={`text-ticker-${ticker}`}>
            {ticker}
          </p>
          <p className="text-sm text-muted-foreground truncate">{companyName}</p>
          {shares && (
            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-shares-${ticker}`}>
              {shares} shares
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono font-medium text-base" data-testid={`text-price-${ticker}`}>
            ${price.toFixed(2)}
          </p>
          {totalValue !== undefined && (
            <p className="font-mono text-xs text-muted-foreground" data-testid={`text-value-${ticker}`}>
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <div
            className={`flex items-center justify-end gap-1 text-sm font-medium ${
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
            data-testid={`text-change-${ticker}`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-mono">
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
