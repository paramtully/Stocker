import News from "@/domain/news";

export const mockNews: Record<string, News["articles"]> = {
    AAPL: [
      {
        id: "aapl-1",
        source: "Bloomberg",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        headline: "Apple Announces Revolutionary AI Chip for iPhone 17, Shares Surge",
        summary: "Apple unveiled its next-generation A19 Bionic chip with advanced neural engine capabilities. The chip promises 40% faster AI processing and improved energy efficiency, positioning Apple ahead in the AI smartphone race.",
        impactAnalysis: [
          "Strong competitive advantage in mobile AI processing could drive iPhone 17 sales",
          "Reduced reliance on third-party AI solutions improves profit margins",
          "Technology leadership reinforces premium pricing strategy"
        ],
        recommendedActions: [
          "Consider holding current positions given positive product momentum",
          "Watch for supply chain updates that could affect production timeline",
          "Monitor competitor responses in the coming weeks"
        ],
        articleUrl: "https://example.com/aapl-ai-chip",
        sentiment: "positive"
      },
      {
        id: "aapl-2",
        source: "CNBC",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        headline: "Apple Faces EU Antitrust Investigation Over App Store Practices",
        summary: "The European Commission has launched a formal investigation into Apple's App Store policies, focusing on the 30% commission fee and restrictions on alternative payment methods.",
        impactAnalysis: [
          "Potential fines up to 10% of global revenue if found in violation",
          "May force changes to App Store business model in European markets",
          "Creates uncertainty around Services revenue growth trajectory"
        ],
        recommendedActions: [
          "Consider reducing exposure if concerned about regulatory risk",
          "Wait for official Apple response before making decisions",
          "Monitor similar investigations in other regions"
        ],
        articleUrl: "https://example.com/aapl-eu-antitrust",
        sentiment: "negative"
      },
      {
        id: "aapl-3",
        source: "Reuters",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        headline: "Apple Reports Record Services Revenue for Q4, Beating Estimates",
        summary: "Apple's Services division reported $25.2 billion in quarterly revenue, surpassing analyst expectations of $24.1 billion. Growth was driven by strong App Store sales and Apple TV+ subscriptions.",
        impactAnalysis: [
          "Services segment continues to grow faster than hardware",
          "Higher margin services revenue improves overall profitability",
          "Validates Apple's strategic shift toward recurring revenue"
        ],
        recommendedActions: [
          "Long-term holders should maintain positions",
          "Consider adding on any short-term weakness",
          "Track subscriber growth metrics in future earnings"
        ],
        articleUrl: "https://example.com/aapl-services-revenue",
        sentiment: "positive"
      }
    ],
    TSLA: [
      {
        id: "tsla-1",
        source: "Wall Street Journal",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        headline: "Tesla Cybertruck Production Ramps Up, Meeting Demand Targets",
        summary: "Tesla has successfully increased Cybertruck production to 5,000 units per week at its Texas Gigafactory, addressing earlier supply constraints and positioning for strong Q1 deliveries.",
        impactAnalysis: [
          "Production improvements suggest manufacturing challenges are resolved",
          "Strong Cybertruck demand validates electric truck market potential",
          "Increased production capacity supports revenue growth projections"
        ],
        recommendedActions: [
          "Monitor weekly production numbers for consistency",
          "Consider position sizing based on delivery guidance",
          "Watch for margin improvements as production scales"
        ],
        articleUrl: "https://example.com/tsla-cybertruck",
        sentiment: "positive"
      }
    ],
    MSFT: [
      {
        id: "msft-1",
        source: "TechCrunch",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        headline: "Microsoft Azure AI Revenue Doubles Year-over-Year",
        summary: "Microsoft reported that Azure AI services revenue has doubled compared to the same quarter last year, driven by enterprise adoption of OpenAI-powered tools and Copilot integrations.",
        impactAnalysis: [
          "AI monetization strategy proving successful at enterprise scale",
          "Azure maintaining competitive position against AWS and Google Cloud",
          "Copilot adoption creating sticky enterprise relationships"
        ],
        recommendedActions: [
          "Strong hold recommendation based on AI leadership",
          "Consider adding to positions on market pullbacks",
          "Monitor enterprise spending trends in tech sector"
        ],
        articleUrl: "https://example.com/msft-azure-ai",
        sentiment: "positive"
      }
    ],
    GOOGL: [
      {
        id: "googl-1",
        source: "Financial Times",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        headline: "Google Search Market Share Stable Despite AI Competition",
        summary: "Despite growing competition from AI-powered search alternatives, Google has maintained its 92% global search market share, according to new data from StatCounter.",
        impactAnalysis: [
          "Core advertising business remains well-protected",
          "AI search integration appearing to retain users effectively",
          "Market dominance provides runway for AI investments"
        ],
        recommendedActions: [
          "Maintain current position with stable outlook",
          "Watch quarterly ad revenue for signs of disruption",
          "Monitor AI product launches and user adoption metrics"
        ],
        articleUrl: "https://example.com/googl-search-share",
        sentiment: "neutral"
      }
    ],
    AMZN: [
      {
        id: "amzn-1",
        source: "MarketWatch",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        headline: "Amazon AWS Announces Major Price Cuts to Compete with Azure",
        summary: "Amazon Web Services has announced a 15% price reduction across its core computing services, responding to competitive pressure from Microsoft Azure and Google Cloud.",
        impactAnalysis: [
          "Margin pressure in cloud segment may affect profitability",
          "Price competition indicates maturing cloud market",
          "Could accelerate customer acquisition but at lower margins"
        ],
        recommendedActions: [
          "Monitor operating margin trends closely",
          "Evaluate position based on AWS growth vs. margin balance",
          "Compare with cloud competitors' pricing strategies"
        ],
        articleUrl: "https://example.com/amzn-aws-pricing",
        sentiment: "neutral"
      }
    ]
  };