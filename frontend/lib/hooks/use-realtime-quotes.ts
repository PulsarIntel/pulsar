"use client"

import { useEffect } from "react"
import { useMarketStore } from "@/lib/stores/market-store"
import type { RealtimeUpdate } from "@/lib/realtime-manager"

export type { RealtimeUpdate }

export function useRealtimeQuotes(symbols: string[]) {
  const updates = useMarketStore((s) => s.realtimeQuotes)
  const connected = useMarketStore((s) => s.connected)
  const subscribe = useMarketStore((s) => s.subscribeSymbols)
  const unsubscribe = useMarketStore((s) => s.unsubscribeSymbols)

  const key = [...symbols].sort().join(",")

  useEffect(() => {
    if (symbols.length === 0) return
    subscribe(symbols)
    return () => unsubscribe(symbols)
  }, [key])

  const filtered: Record<string, RealtimeUpdate> = {}
  for (const sym of symbols) {
    const s = sym.toUpperCase()
    if (updates[s]) filtered[s] = updates[s]
  }

  return { updates: filtered, connected }
}
