import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Stock {
  id: string;
  ticker: string;
  companyName: string | null;
  shares: number;
  purchasePrice: string | null;
  purchaseDate: string | null;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
}

interface TickerSuggestion {
  symbol: string;
  name: string;
}

interface AddStockFormProps {
  onAddStock?: (ticker: string) => void;
  onRemoveStock?: (ticker: string) => void;
}

const suggestionCache = new Map<string, TickerSuggestion[]>();

export function AddStockForm({ onAddStock, onRemoveStock }: AddStockFormProps) {
  const { data: stocksData } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });
  
  const stocks = stocksData?.map(s => s.ticker) || [];
  const [ticker, setTicker] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [pendingTicker, setPendingTicker] = useState("");
  const [shares, setShares] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [purchasePrice, setPurchasePrice] = useState("");
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const upperQuery = query.toUpperCase();
    
    if (suggestionCache.has(upperQuery)) {
      setSuggestions(suggestionCache.get(upperQuery)!);
      setShowSuggestions(true);
      setIsLoadingSuggestions(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoadingSuggestions(true);

    try {
      const response = await fetch(`/api/tickers/search?q=${encodeURIComponent(upperQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      
      const data: TickerSuggestion[] = await response.json();
      
      if (currentRequestId === requestIdRef.current) {
        suggestionCache.set(upperQuery, data);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
        setIsLoadingSuggestions(false);
      }
    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoadingSuggestions(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (ticker.length >= 2) {
      setIsLoadingSuggestions(true);
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(ticker);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [ticker, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: TickerSuggestion) => {
    setTicker(suggestion.symbol);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const addStockMutation = useMutation({
    mutationFn: async (data: { ticker: string; shares: number; purchaseDate: string; purchasePrice?: string }) => {
      return apiRequest("POST", "/api/stocks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/charts"] });
      onAddStock?.(pendingTicker);
      toast({
        title: "Stock added",
        description: `${pendingTicker} has been added to your portfolio`,
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeStockMutation = useMutation({
    mutationFn: async (ticker: string) => {
      return apiRequest("DELETE", `/api/stocks/${ticker}`);
    },
    onSuccess: (_, ticker) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/charts"] });
      onRemoveStock?.(ticker);
      toast({
        title: "Stock removed",
        description: `${ticker} has been removed from your portfolio`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTicker("");
    setPendingTicker("");
    setShares("1");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchasePrice("");
    setShowDialog(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTicker = ticker.toUpperCase().trim();
    
    if (!normalizedTicker) {
      toast({
        title: "Invalid ticker",
        description: "Please enter a stock ticker symbol",
        variant: "destructive",
      });
      return;
    }

    if (stocks.includes(normalizedTicker)) {
      toast({
        title: "Stock already exists",
        description: `${normalizedTicker} is already in your portfolio`,
        variant: "destructive",
      });
      return;
    }

    setPendingTicker(normalizedTicker);
    setShowDialog(true);
  };

  const handleConfirmAdd = () => {
    const sharesNum = parseInt(shares, 10);
    if (isNaN(sharesNum) || sharesNum < 1) {
      toast({
        title: "Invalid shares",
        description: "Please enter a valid number of shares (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    addStockMutation.mutate({
      ticker: pendingTicker,
      shares: sharesNum,
      purchaseDate,
      purchasePrice: purchasePrice || undefined,
    });
  };

  return (
    <>
      <Card data-testid="card-add-stock">
        <CardHeader>
          <CardTitle className="text-lg">Manage Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Enter ticker (e.g., AAPL)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="font-mono"
                data-testid="input-ticker"
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
                  data-testid="suggestions-dropdown"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.symbol}
                      type="button"
                      className={`w-full px-3 py-2 text-left hover-elevate flex items-center gap-2 ${
                        index === selectedIndex ? "bg-accent" : ""
                      }`}
                      onClick={() => selectSuggestion(suggestion)}
                      data-testid={`suggestion-${suggestion.symbol}`}
                    >
                      <span className="font-mono font-medium">{suggestion.symbol}</span>
                      <span className="text-muted-foreground text-sm truncate">
                        {suggestion.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" data-testid="button-add-stock">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {stocks.map((stock) => (
              <Badge
                key={stock}
                variant="secondary"
                className="font-mono text-sm px-3 py-1"
                data-testid={`badge-stock-${stock}`}
              >
                {stock}
                <button
                  onClick={() => removeStockMutation.mutate(stock)}
                  className="ml-2 hover:text-destructive transition-colors"
                  disabled={removeStockMutation.isPending}
                  data-testid={`button-remove-${stock}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {pendingTicker} to Portfolio</DialogTitle>
            <DialogDescription>
              Enter the purchase details for this stock
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="1"
                data-testid="input-shares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <div className="relative">
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  data-testid="input-purchase-date"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price per Share (optional)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g., 150.00"
                data-testid="input-purchase-price"
              />
              <p className="text-xs text-muted-foreground">
                If not provided, the current market price will be used
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAdd} 
              disabled={addStockMutation.isPending}
              data-testid="button-confirm-add"
            >
              {addStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
