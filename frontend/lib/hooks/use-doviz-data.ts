"use client"

import { useDovizStore } from "@/lib/stores/doviz-store"
import type { DovizUpdate } from "@/lib/doviz-realtime-manager"

export type { DovizSymbolMeta, DovizSymbolsResponse } from "@/lib/stores/doviz-store"

export function useDovizQuotes(intervalMs = 10_000, category?: string) {
  const allQuotes = useDovizStore((s) => s.quotes)
  const loading = Object.keys(allQuotes).length === 0

  if (category) {
    const cats = new Set(category.split(","))
    const filtered: Record<string, DovizUpdate> = {}
    for (const [k, v] of Object.entries(allQuotes)) {
      if (cats.has(v.category)) filtered[k] = v
    }
    return { data: loading ? null : filtered, loading }
  }

  return { data: loading ? null : allQuotes, loading }
}

export function useDovizSymbols() {
  return useDovizStore((s) => s.symbols)
}
