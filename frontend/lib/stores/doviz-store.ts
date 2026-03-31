"use client"

import { create } from "zustand"
import { dovizRealtimeManager, type DovizUpdate } from "@/lib/doviz-realtime-manager"
import { API_BASE } from "@/lib/constants"

export interface DovizSymbolMeta {
  name: string
  category: string
  category_label: string
}

export interface DovizSymbolsResponse {
  symbols: Record<string, DovizSymbolMeta>
  categories: Record<string, string>
}

interface DovizState {
  quotes: Record<string, DovizUpdate>
  symbols: DovizSymbolsResponse | null
  connected: boolean

  fetchQuotes: (category?: string) => Promise<void>
  fetchSymbols: () => Promise<void>
  initStream: () => void
}

export const useDovizStore = create<DovizState>((set, get) => ({
  quotes: {},
  symbols: null,
  connected: false,

  fetchQuotes: async (category?: string) => {
    try {
      const params = category ? `?category=${category}` : ""
      const res = await fetch(`${API_BASE}/doviz/quotes${params}`)
      if (res.ok) {
        const data = await res.json()
        set((s) => ({ quotes: { ...s.quotes, ...data } }))
      }
    } catch {}
  },

  fetchSymbols: async () => {
    if (get().symbols) return
    try {
      const res = await fetch(`${API_BASE}/doviz/symbols`)
      if (res.ok) set({ symbols: await res.json() })
    } catch {}
  },

  initStream: () => {
    dovizRealtimeManager.connect()
    dovizRealtimeManager.onStatusChange((connected) => set({ connected }))
    dovizRealtimeManager.addListener((update) => {
      set((s) => ({
        quotes: { ...s.quotes, [update.ticker]: update },
      }))
    })
  },
}))
