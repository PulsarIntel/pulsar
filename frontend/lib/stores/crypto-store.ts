"use client"

import { create } from "zustand"
import { cryptoRealtimeManager, type CryptoUpdate } from "@/lib/crypto-realtime-manager"
import { API_BASE } from "@/lib/constants"

export type { CryptoUpdate }

interface CryptoState {
  quotes: Record<string, CryptoUpdate>
  connected: boolean

  fetchQuotes: () => Promise<void>
  initStream: () => void
}

export const useCryptoStore = create<CryptoState>((set) => ({
  quotes: {},
  connected: false,

  fetchQuotes: async () => {
    try {
      const res = await fetch(`${API_BASE}/crypto/quotes`)
      if (res.ok) {
        const data = await res.json()
        set((s) => ({ quotes: { ...s.quotes, ...data } }))
      }
    } catch {}
  },

  initStream: () => {
    cryptoRealtimeManager.connect()
    cryptoRealtimeManager.onStatusChange((connected) => set({ connected }))
    cryptoRealtimeManager.addListener((update) => {
      set((s) => ({
        quotes: { ...s.quotes, [update.ticker]: update },
      }))
    })
  },
}))
