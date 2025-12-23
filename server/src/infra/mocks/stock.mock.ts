import { Stock } from "server/src/domain/stock";

export const mockStocks: Stock[] = [
    { ticker: "AAPL", companyName: "Apple Inc.", price: 178.52, changePercent: 2.34 },
    { ticker: "TSLA", companyName: "Tesla, Inc.", price: 245.18, changePercent: -1.87 },
    { ticker: "MSFT", companyName: "Microsoft Corporation", price: 378.91, changePercent: 0.92 },
    { ticker: "GOOGL", companyName: "Alphabet Inc.", price: 141.23, changePercent: 1.15 },
    { ticker: "AMZN", companyName: "Amazon.com, Inc.", price: 178.25, changePercent: -0.45 },
    { ticker: "NVDA", companyName: "NVIDIA Corporation", price: 495.22, changePercent: 3.21 },
    { ticker: "META", companyName: "Meta Platforms, Inc.", price: 325.67, changePercent: 0.88 },
  ];
  