import { useState } from "react";
import { NewsFeedSelector } from "../NewsFeedSelector";

// todo: remove mock functionality
const mockStocks = [
  { ticker: "AAPL", companyName: "Apple Inc.", articleCount: 12 },
  { ticker: "TSLA", companyName: "Tesla, Inc.", articleCount: 8 },
  { ticker: "MSFT", companyName: "Microsoft Corporation", articleCount: 15 },
  { ticker: "GOOGL", companyName: "Alphabet Inc.", articleCount: 10 },
  { ticker: "AMZN", companyName: "Amazon.com, Inc.", articleCount: 9 },
];

export default function NewsFeedSelectorExample() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-4 max-w-md">
      <NewsFeedSelector
        stocks={mockStocks}
        selectedTicker={selected}
        onSelect={(ticker) => {
          setSelected(ticker);
          console.log("Selected:", ticker);
        }}
      />
    </div>
  );
}
