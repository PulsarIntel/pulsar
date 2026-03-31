"use client"

import { useMemo, useEffect } from "react"
import { useMarketStore } from "@/lib/stores/market-store"
import { useDovizStore, type DovizSymbolMeta } from "@/lib/stores/doviz-store"
import { useCryptoStore } from "@/lib/stores/crypto-store"

export interface SearchableAsset {
  ticker: string
  name: string
  type: "stock" | "currency" | "crypto"
  category?: string
}

export function useAllAssets() {
  const stocks = useMarketStore((s) => s.assets)
  const fetchAssets = useMarketStore((s) => s.fetchAssets)
  const dovizSymbols = useDovizStore((s) => s.symbols)
  const fetchSymbols = useDovizStore((s) => s.fetchSymbols)
  const cryptoQuotes = useCryptoStore((s) => s.quotes)

  useEffect(() => {
    fetchAssets()
    fetchSymbols()
  }, [fetchAssets, fetchSymbols])

  return useMemo(() => {
    const result: SearchableAsset[] = []

    for (const s of stocks) {
      result.push({ ticker: s.ticker, name: s.name, type: "stock" })
    }

    if (dovizSymbols) {
      for (const [key, meta] of Object.entries(dovizSymbols.symbols)) {
        const m = meta as DovizSymbolMeta & { bank_id?: number }
        if (m.bank_id) continue
        result.push({
          ticker: key,
          name: m.name,
          type: "currency",
          category: m.category,
        })
      }
    }

    const seenCrypto = new Set<string>()
    for (const q of Object.values(cryptoQuotes)) {
      if (seenCrypto.has(q.ticker)) continue
      seenCrypto.add(q.ticker)
      result.push({
        ticker: q.ticker,
        name: q.name,
        type: "crypto",
        category: "crypto",
      })
    }

    return result
  }, [stocks, dovizSymbols, cryptoQuotes])
}

export function filterAssets(
  assets: SearchableAsset[],
  query: string,
  exclude?: Set<string>,
  limit = 20
): SearchableAsset[] {
  let list = exclude ? assets.filter((a) => !exclude.has(a.ticker)) : assets
  if (!query) return list.slice(0, limit)

  const q = query.toLowerCase()
  return list
    .filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      const at = a.ticker.toLowerCase()
      const bt = b.ticker.toLowerCase()
      if (at === q && bt !== q) return -1
      if (bt === q && at !== q) return 1
      if (at.startsWith(q) && !bt.startsWith(q)) return -1
      if (bt.startsWith(q) && !at.startsWith(q)) return 1
      const an = a.name.toLowerCase().startsWith(q)
      const bn = b.name.toLowerCase().startsWith(q)
      if (an && !bn) return -1
      if (bn && !an) return 1
      return at.localeCompare(bt)
    })
    .slice(0, limit)
}
