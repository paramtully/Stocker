import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewsArticleCard } from "@/components/NewsArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Loader2 } from "lucide-react";

interface Stock {
  ticker: string;
  companyName: string;
}

interface NewsArticle {
  id: string;
  ticker: string;
  source: string;
  publishedAt: string;
  publishedAtFormatted: string;
  headline: string;
  summary: string;
  impactAnalysis: string[];
  recommendedActions: string[];
  articleUrl: string;
  sentiment: "positive" | "negative" | "neutral";
}

interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  hasMore: boolean;
}

const PAGE_SIZE = 10;

export default function NewsFeed() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: stocks, isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  const { data: newsData, isLoading: newsLoading, isFetching } = useQuery<NewsResponse>({
    queryKey: ["/api/news", selectedTicker, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: offset.toString(),
      });
      if (selectedTicker) {
        params.set("ticker", selectedTicker);
      }
      const response = await fetch(`/api/news?${params}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      return response.json();
    },
  });

  useEffect(() => {
    if (newsData) {
      if (offset === 0) {
        setArticles(newsData.articles);
      } else {
        setArticles(prev => [...prev, ...newsData.articles]);
      }
      setHasMore(newsData.hasMore);
      setTotal(newsData.total);
    }
  }, [newsData, offset]);

  useEffect(() => {
    setArticles([]);
    setOffset(0);
    setHasMore(true);
  }, [selectedTicker]);

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setOffset(prev => prev + PAGE_SIZE);
    }
  }, [hasMore, isFetching]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isFetching]);

  const handleTickerChange = (value: string) => {
    if (value === "all") {
      setSelectedTicker(null);
    } else {
      setSelectedTicker(value);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">News Feed</h1>
        <p className="text-muted-foreground">
          AI-summarized news for your portfolio stocks. Updated automatically at 8am and 6pm.
        </p>
      </div>

      <Card data-testid="card-news-filter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Newspaper className="h-5 w-5" />
            Filter by Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stocksLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedTicker || "all"} 
              onValueChange={handleTickerChange}
            >
              <SelectTrigger data-testid="select-stock-filter">
                <SelectValue placeholder="All portfolio stocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="select-item-all">
                  <span className="font-medium">All Stocks</span>
                </SelectItem>
                {stocks?.map((stock) => (
                  <SelectItem 
                    key={stock.ticker} 
                    value={stock.ticker} 
                    data-testid={`select-item-${stock.ticker}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{stock.ticker}</span>
                      <span className="text-muted-foreground">{stock.companyName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {newsLoading && offset === 0 && (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {articles.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Showing {articles.length} of {total} article{total !== 1 ? "s" : ""}
            {selectedTicker ? ` for ${selectedTicker}` : " from your portfolio"}
          </p>
          {articles.map((article) => (
            <NewsArticleCard
              key={article.id}
              id={article.id}
              ticker={article.ticker}
              source={article.source}
              publishedAt={article.publishedAtFormatted}
              headline={article.headline}
              summary={article.summary}
              impactAnalysis={article.impactAnalysis}
              recommendedActions={article.recommendedActions}
              articleUrl={article.articleUrl}
              sentiment={article.sentiment}
            />
          ))}
        </div>
      )}

      {hasMore && articles.length > 0 && (
        <div ref={loaderRef} className="py-4 flex justify-center">
          {isFetching ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="outline" onClick={loadMore} data-testid="button-load-more">
              Load More
            </Button>
          )}
        </div>
      )}

      {!newsLoading && articles.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground" />
          <div className="text-muted-foreground">
            <p className="font-medium">No news articles found</p>
            <p className="text-sm mt-1">
              News is updated automatically at 8am and 6pm daily
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
