import Quote from "server/src/domain/stock/quote";

export const mockQuotes: Quote[] = [
  { ticker: "AAPL", companyName: "Apple Inc.", price: 178.52, changePercent: 2.34, shares: 100, purchasePrice: 178.52, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "TSLA", companyName: "Tesla, Inc.", price: 245.18, changePercent: -1.87, shares: 100, purchasePrice: 245.18, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "MSFT", companyName: "Microsoft Corporation", price: 378.91, changePercent: 0.92, shares: 100, purchasePrice: 378.91, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "GOOGL", companyName: "Alphabet Inc.", price: 141.23, changePercent: 1.15, shares: 100, purchasePrice: 141.23, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "AMZN", companyName: "Amazon.com, Inc.", price: 178.25, changePercent: -0.45, shares: 100, purchasePrice: 178.25, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "NVDA", companyName: "NVIDIA Corporation", price: 495.22, changePercent: 3.21, shares: 100, purchasePrice: 495.22, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { ticker: "META", companyName: "Meta Platforms, Inc.", price: 325.67, changePercent: 0.88, shares: 100, purchasePrice: 325.67, purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
];
  