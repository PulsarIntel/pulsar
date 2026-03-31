import type { DovizUpdate } from "@/lib/doviz-realtime-manager"

export interface DovizQuoteWithBank extends DovizUpdate {
  bankId?: number
  bankName?: string
  bankIcon?: string
  assetLabel?: string
  asset?: string
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

export interface Stock {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: string
  volume: string
  peRatio: number | null
  week52High: number
  week52Low: number
  sector: string
  industry: string
  description: string
  sparkline: number[]
}

export interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: string
  avgVolume: string
  marketCap: string
  peRatio: number | null
  eps: number | null
  beta: number | null
  dividend: number | null
  dividendYield: number | null
  week52High: number
  week52Low: number
  sector: string
  industry: string
  description: string
}

export interface PortfolioPosition {
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
  realizedPnl: number
  transactionCount: number
  sector: string
  sparkline: number[]
}

export interface Portfolio {
  totalValue: number
  totalCost: number
  dayChange: number
  dayChangePercent: number
  totalReturn: number
  totalReturnPercent: number
  realizedPnl: number
  positions: PortfolioPosition[]
}

export interface Transaction {
  id: string
  ticker: string
  type: "buy" | "sell"
  shares: number
  price_per_share: number
  total_cost: number
  date: string
  currency: string
  fee: number
  notes: string
  created_at: string
}

export interface Position {
  id: string
  ticker: string
  currency: string
  total_shares: number
  avg_cost: number
  total_invested: number
  realized_pnl: number
  first_transaction_date: string
  transaction_count: number
}

export interface WatchlistItem {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: string
  volume: string
  sparkline: number[]
}

export interface EarningsEvent {
  ticker: string
  name: string
  date: string
  time: "before-market" | "after-market"
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: string | null
  revenueActual: string | null
  surprise: number | null
}

export interface ChartDataPoint {
  date: string
  value: number
  volume?: number
}

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  ticker?: string
  sentiment: "positive" | "negative" | "neutral"
}

export interface HeatmapStock {
  ticker: string
  name: string
  changePercent: number
  marketCap: number
  price: number
  industry: string
  afterHoursPrice: number
  afterHoursChangePercent: number
  summary: string
}

export interface HeatmapSector {
  name: string
  changePercent: number
  stocks: HeatmapStock[]
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y"

export interface NavItem {
  label: string
  href: string
  icon: string
}
