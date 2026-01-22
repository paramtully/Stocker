import { StockChart } from "../StockChart";

// todo: remove mock functionality
const generateMockData = (days: number, startPrice: number, volatility: number) => {
  const data = [];
  let price = startPrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    price = price + (Math.random() - 0.48) * volatility;
    price = Math.max(price, startPrice * 0.5);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
};

const mockData = {
  "1D": generateMockData(1, 178, 2),
  "1W": generateMockData(7, 175, 3),
  "1M": generateMockData(30, 170, 5),
  "1Y": generateMockData(365, 140, 8),
  "5Y": generateMockData(365 * 5, 80, 15),
  "ALL": generateMockData(365 * 10, 30, 20),
};

export default function StockChartExample() {
  return (
    <div className="p-4">
      <StockChart
        ticker="AAPL"
        companyName="Apple Inc."
        data={mockData}
      />
    </div>
  );
}
