import { StockCard } from "../StockCard";

export default function StockCardExample() {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-sm">
      <StockCard
        ticker="AAPL"
        companyName="Apple Inc."
        price={178.52}
        changePercent={2.34}
        onClick={() => console.log("AAPL clicked")}
      />
      <StockCard
        ticker="TSLA"
        companyName="Tesla, Inc."
        price={245.18}
        changePercent={-1.87}
        isSelected
        onClick={() => console.log("TSLA clicked")}
      />
    </div>
  );
}
