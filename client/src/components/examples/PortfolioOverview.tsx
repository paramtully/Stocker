import { PortfolioOverview } from "../PortfolioOverview";

export default function PortfolioOverviewExample() {
  return (
    <div className="p-4">
      <PortfolioOverview
        totalValue={125847.32}
        dailyChange={1234.56}
        dailyChangePercent={0.99}
        totalGain={15847.32}
        totalGainPercent={14.41}
      />
    </div>
  );
}
