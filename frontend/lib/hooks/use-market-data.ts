"use client"

import { useEffect, useCallback, useRef } from "react"
import { useMarketStore } from "@/lib/stores/market-store"

export interface Quote {
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
  sector: string
  industry: string
}

export interface HeatmapSector {
  name: string
  changePercent: number
  stocks: {
    ticker: string
    name: string
    changePercent: number
    marketCap: number
    price: number
    industry: string
    afterHoursPrice: number
    afterHoursChangePercent: number
    summary: string
  }[]
}

export interface AlpacaNews {
  id: number
  headline: string
  summary: string
  author: string
  source: string
  url: string
  symbols: string[]
  created_at: string
  updated_at: string
}

export interface Movers {
  gainers: { symbol: string; price: number; change: number; percent_change: number }[]
  losers: { symbol: string; price: number; change: number; percent_change: number }[]
}

export interface WorkerStatus {
  last_update: string
  market_open: boolean
  interval: number
  symbols_count: number
}

export interface Asset {
  ticker: string
  name: string
  exchange: string
  tradable: boolean
}

export function useQuotes() {
  const data = useMarketStore((s) => s.quotes)
  const loading = Object.keys(data).length === 0
  return { data: loading ? null : data, loading }
}

export function useAllQuotes() {
  const data = useMarketStore((s) => s.allQuotes)
  const fetchAllQuotes = useMarketStore((s) => s.fetchAllQuotes)
  const loading = Object.keys(data).length === 0

  useEffect(() => {
    fetchAllQuotes()
    const id = setInterval(fetchAllQuotes, 30_000)
    return () => clearInterval(id)
  }, [fetchAllQuotes])

  return { data: loading ? null : data, loading }
}

export function useHeatmap() {
  const data = useMarketStore((s) => s.heatmap)
  const fetchHeatmap = useMarketStore((s) => s.fetchHeatmap)
  const loading = data.length === 0

  useEffect(() => {
    fetchHeatmap()
    const id = setInterval(fetchHeatmap, 30_000)
    return () => clearInterval(id)
  }, [fetchHeatmap])

  return { data: loading ? null : data, loading }
}

export function useMovers() {
  const data = useMarketStore((s) => s.movers)
  const loading = data === null
  return { data, loading }
}

export function useNews() {
  const data = useMarketStore((s) => s.news)
  const loading = data.length === 0
  return { data: loading ? null : data, loading }
}

export function useWorkerStatus() {
  const data = useMarketStore((s) => s.status)
  return { data, loading: data === null }
}

export function useAssets() {
  const data = useMarketStore((s) => s.assets)
  const fetchAssets = useMarketStore((s) => s.fetchAssets)

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return { data: data.length === 0 ? null : data, loading: data.length === 0 }
}

export function useSymbolQuotes(symbols: string[]) {
  const allQuotes = useMarketStore((s) => s.quotes)
  const fetchSymbolQuotes = useMarketStore((s) => s.fetchSymbolQuotes)
  const subscribeSymbols = useMarketStore((s) => s.subscribeSymbols)
  const unsubscribeSymbols = useMarketStore((s) => s.unsubscribeSymbols)
  const rt = useMarketStore((s) => s.realtimeQuotes)
  const lastRef = useRef<Record<string, Quote> | null>(null)

  const key = symbols.join(",")

  useEffect(() => {
    if (symbols.length === 0) return
    fetchSymbolQuotes(symbols)
    subscribeSymbols(symbols)
    const id = setInterval(() => fetchSymbolQuotes(symbols), 30_000)
    return () => {
      clearInterval(id)
      unsubscribeSymbols(symbols)
    }
  }, [key])

  const merged: Record<string, Quote> = {}
  for (const sym of symbols) {
    const q = allQuotes[sym]
    if (q) {
      const r = rt[sym]
      merged[sym] = r?.price ? { ...q, price: r.price } : q
    }
  }

  if (Object.keys(merged).length > 0) {
    lastRef.current = merged
    return { data: merged }
  }
  return { data: lastRef.current }
}
