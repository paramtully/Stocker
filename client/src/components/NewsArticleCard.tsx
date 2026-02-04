import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsArticleCardProps {
  id: string;
  ticker?: string;
  source: string;
  publishedAt: string;
  headline: string;
  summary: string;
  impactAnalysis: string[];
  recommendedActions: string[];
  articleUrl: string;
  sentiment: "positive" | "negative" | "neutral";
}

export function NewsArticleCard({
  id,
  ticker,
  source,
  publishedAt,
  headline,
  summary,
  impactAnalysis,
  recommendedActions,
  articleUrl,
  sentiment,
}: NewsArticleCardProps) {
  const sentimentConfig = {
    positive: {
      icon: TrendingUp,
      label: "Positive",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    negative: {
      icon: TrendingDown,
      label: "Negative",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
    neutral: {
      icon: Minus,
      label: "Neutral",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    },
  };

  const { icon: SentimentIcon, label, className } = sentimentConfig[sentiment];

  return (
    <Card data-testid={`card-news-${id}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {ticker && (
              <Badge variant="outline" className="font-mono text-xs">
                {ticker}
              </Badge>
            )}
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {source}
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">{publishedAt}</span>
          </div>
          <Badge className={className}>
            <SentimentIcon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold leading-tight" data-testid={`text-headline-${id}`}>
          {headline}
        </h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-md p-4">
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            AI Summary
          </h4>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Impact Analysis
          </h4>
          <ul className="space-y-2">
            {impactAnalysis.map((point, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Recommended Actions
          </h4>
          <ul className="space-y-2">
            {recommendedActions.map((action, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-chart-2 mt-0.5">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="default"
            size="sm"
            onClick={() => window.open(articleUrl, "_blank")}
            data-testid={`button-read-full-${id}`}
          >
            Read Full Article
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
