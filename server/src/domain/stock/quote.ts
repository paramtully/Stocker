export default interface Quote {
    ticker: string;
    companyName: string;
    price: number;                  // in USD
    changePercent: number;          // % change from previous day's close
    shares: number;                 // number of shares owned
    purchasePrice: number;           // purchase price per share
    purchaseDate: Date;              // date of purchase
}