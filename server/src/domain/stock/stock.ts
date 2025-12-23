export default interface Stock {   
    ticker: string
    companyName: string
    cik: string
    isin: string
    cusip: string
    marketCap: number        
    industry: string        // "Technology", "Financial Services", "Healthcare", etc.
    exchange: string        // NASDAQ, NYSE, etc. (NASDAQ is the default and is only supported for now)
}