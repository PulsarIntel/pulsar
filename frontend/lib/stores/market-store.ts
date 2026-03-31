"use client"

import { create } from "zustand"
import type { Quote, HeatmapSector, AlpacaNews, Movers, WorkerStatus, Asset } from "@/lib/hooks/use-market-data"
import type { RealtimeUpdate } from "@/lib/realtime-manager"
import { realtimeManager } from "@/lib/realtime-manager"
import { API_BASE } from "@/lib/constants"

interface MarketState {
  quotes: Record<string, Quote>
  allQuotes: Record<string, Quote>
  heatmap: HeatmapSector[]
  movers: Movers | null
  news: AlpacaNews[]
  status: WorkerStatus | null
  assets: Asset[]
  realtimeQuotes: Record<string, RealtimeUpdate>
  connected: boolean
  loading: Record<string, boolean>

  fetchQuotes: () => Promise<void>
  fetchAllQuotes: () => Promise<void>
  fetchHeatmap: () => Promise<void>
  fetchMovers: () => Promise<void>
  fetchNews: () => Promise<void>
  fetchStatus: () => Promise<void>
  fetchAssets: () => Promise<void>
  fetchSymbolQuotes: (symbols: string[]) => Promise<void>
  subscribeSymbols: (symbols: string[]) => void
  unsubscribeSymbols: (symbols: string[]) => void
  initStreams: () => void
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const useMarketStore = create<MarketState>((set, get) => {
  const listener = (update: RealtimeUpdate) => {
    set((s) => ({
      realtimeQuotes: { ...s.realtimeQuotes, [update.ticker]: update },
    }))
  }

  return {
    quotes: {},
    allQuotes: {},
    heatmap: [],
    movers: null,
    news: [],
    status: null,
    assets: [],
    realtimeQuotes: {},
    connected: false,
    loading: {},

    fetchQuotes: async () => {
      try {
        const data = await fetchApi<Record<string, Quote>>(
          "/market/quotes?symbols=AAPL,MSFT,NVDA,GOOGL,META,AVGO,AMZN,TSLA,JPM,V,MA,BAC,LLY,UNH,XOM,NFLX"
        )
        set({ quotes: data })
      } catch {}
    },

    fetchAllQuotes: async () => {
      try {
        const data = await fetchApi<Record<string, Quote>>("/market/quotes?symbols=all")
        if (Object.keys(data).length > 0) {
          set({ allQuotes: data })
        }
      } catch {}
    },

    fetchHeatmap: async () => {
      try {
        const data = await fetchApi<HeatmapSector[]>("/market/heatmap")
        set({ heatmap: data })
      } catch {}
    },

    fetchMovers: async () => {
      try {
        const data = await fetchApi<Movers>("/market/movers")
        set({ movers: data })
      } catch {}
    },

    fetchNews: async () => {
      try {
        const data = await fetchApi<AlpacaNews[]>("/market/news?limit=10")
        set({ news: data })
      } catch {}
    },

    fetchStatus: async () => {
      try {
        const data = await fetchApi<WorkerStatus>("/market/status")
        set({ status: data })
      } catch {}
    },

    fetchAssets: async () => {
      if (get().assets.length > 0) return
      try {
        const data = await fetchApi<Asset[]>("/market/assets")
        set({ assets: data })
      } catch {}
    },

    fetchSymbolQuotes: async (symbols: string[]) => {
      if (symbols.length === 0) return
      try {
        const data = await fetchApi<Record<string, Quote>>(
          `/market/quotes?symbols=${symbols.join(",")}`
        )
        if (Object.keys(data).length > 0) {
          set((s) => ({ quotes: { ...s.quotes, ...data } }))
        }
      } catch {}
    },

    subscribeSymbols: (symbols: string[]) => {
      realtimeManager.subscribe(symbols, listener)
    },

    unsubscribeSymbols: (symbols: string[]) => {
      realtimeManager.unsubscribe(symbols, listener)
    },

    initStreams: () => {
      realtimeManager.connect()
      realtimeManager.onStatusChange((connected) => set({ connected }))
    },
  }
})
