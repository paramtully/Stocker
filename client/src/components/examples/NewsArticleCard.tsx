import { useState } from "react";
import { NewsArticleCard } from "../NewsArticleCard";

// todo: remove mock functionality
const mockArticles = [
  {
    id: "1",
    source: "Bloomberg",
    publishedAt: "Dec 15, 2025 - 9:30 AM",
    headline: "Apple Announces Revolutionary AI Chip for iPhone 17, Shares Surge",
    summary: "Apple unveiled its next-generation A19 Bionic chip with advanced neural engine capabilities. The chip promises 40% faster AI processing and improved energy efficiency, positioning Apple ahead in the AI smartphone race.",
    impactAnalysis: [
      "Strong competitive advantage in mobile AI processing could drive iPhone 17 sales",
      "Reduced reliance on third-party AI solutions improves profit margins",
      "Technology leadership reinforces premium pricing strategy",
    ],
    recommendedActions: [
      "Consider holding current positions given positive product momentum",
      "Watch for supply chain updates that could affect production timeline",
      "Monitor competitor responses in the coming weeks",
    ],
    articleUrl: "https://example.com/article1",
    sentiment: "positive" as const,
  },
  {
    id: "2",
    source: "CNBC",
    publishedAt: "Dec 14, 2025 - 2:15 PM",
    headline: "Apple Faces EU Antitrust Investigation Over App Store Practices",
    summary: "The European Commission has launched a formal investigation into Apple's App Store policies, focusing on the 30% commission fee and restrictions on alternative payment methods.",
    impactAnalysis: [
      "Potential fines up to 10% of global revenue if found in violation",
      "May force changes to App Store business model in European markets",
      "Creates uncertainty around Services revenue growth trajectory",
    ],
    recommendedActions: [
      "Consider reducing exposure if concerned about regulatory risk",
      "Wait for official Apple response before making decisions",
      "Monitor similar investigations in other regions",
    ],
    articleUrl: "https://example.com/article2",
    sentiment: "negative" as const,
  },
];

export default function NewsArticleCardExample() {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="p-4">
      <NewsArticleCard
        {...mockArticles[currentIndex]}
        currentIndex={currentIndex}
        totalArticles={mockArticles.length}
        onPrevious={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        onNext={() => setCurrentIndex(Math.min(mockArticles.length - 1, currentIndex + 1))}
      />
    </div>
  );
}
