export default interface Quote {
    ticker: string;
    companyName: string;            // name of the company
    price: number;                  // in USD
    changePercent: number;          // % change from previous day's close
    shares: number;                 // number of shares in the holding
    purchasePrice: number;          // purchase price of the holding
    purchaseDate: Date;             // purchase date of the holding
}