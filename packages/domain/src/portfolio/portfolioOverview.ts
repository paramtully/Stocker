export default interface PortfolioOverview {
    totalValue: number;   // total value of the portfolio in USD
    dailyChange: number;   // daily change of the portfolio in USD
    dailyChangePercent: number;   // daily change percentage of the portfolio
    totalGain: number;   // total gain of the portfolio in USD
    totalGainPercent: number;   // total gain percentage of the portfolio
    stockCount: number;   // number of stocks in the portfolio
}