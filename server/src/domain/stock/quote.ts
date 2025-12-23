export default interface Quote {
    ticker: string;
    companyName: string;            // name of the company
    price: number;                  // in USD
    changePercent: number;          // % change from previous day's close
}