import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper } from "lucide-react";

interface Stock {
  ticker: string;
  companyName: string;
}

interface NewsFeedSelectorProps {
  stocks: Stock[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
}

export function NewsFeedSelector({
  stocks,
  selectedTicker,
  onSelect,
}: NewsFeedSelectorProps) {
  return (
    <Card data-testid="card-news-selector">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="h-5 w-5" />
          Select Stock for News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedTicker || ""} onValueChange={onSelect}>
          <SelectTrigger data-testid="select-stock-news">
            <SelectValue placeholder="Choose a stock from your portfolio" />
          </SelectTrigger>
          <SelectContent>
            {stocks.map((stock) => (
              <SelectItem key={stock.ticker} value={stock.ticker} data-testid={`select-item-${stock.ticker}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{stock.ticker}</span>
                  <span className="text-muted-foreground">{stock.companyName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
