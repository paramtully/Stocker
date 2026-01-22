import { useState } from "react";
import { AddStockForm } from "../AddStockForm";
import { Toaster } from "@/components/ui/toaster";

export default function AddStockFormExample() {
  // todo: remove mock functionality
  const [stocks, setStocks] = useState(["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN"]);

  const handleAddStock = (ticker: string) => {
    setStocks((prev) => [...prev, ticker]);
  };

  const handleRemoveStock = (ticker: string) => {
    setStocks((prev) => prev.filter((s) => s !== ticker));
  };

  return (
    <div className="p-4 max-w-md">
      <AddStockForm
        stocks={stocks}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
      />
      <Toaster />
    </div>
  );
}
