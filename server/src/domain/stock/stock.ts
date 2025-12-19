export default interface Stock {   
    ticker: string
    companyName: string
    dayChangePercent: number | null // % change from previous day's close
}