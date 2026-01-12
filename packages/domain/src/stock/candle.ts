export default interface Candle {   
    ticker: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: Date;
}