"use client"

import { useQuotes } from "@/lib/hooks/use-market-data"
import { IndexCard } from "@/components/dashboard/index-card"
import type { MarketIndex } from "@/lib/types"

const SECTOR_INDICES: {
  symbol: string
  name: string
  tickers: string[]
}[] = [
  { symbol: "TECH", name: "Technology", tickers: ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO"] },
  { symbol: "FIN", name: "Financials", tickers: ["JPM", "V", "MA", "BAC"] },
  { symbol: "HLTH", name: "Healthcare", tickers: ["LLY", "UNH"] },
  { symbol: "ENRG", name: "Energy", tickers: ["XOM"] },
]

function MarketOverview() {
  const { data: quotes, loading } = useQuotes()

  const indices: MarketIndex[] = SECTOR_INDICES.map((sector) => {
    if (!quotes) {
      return { symbol: sector.symbol, name: sector.name, value: 0, change: 0, changePercent: 0 }
    }
    let totalChange = 0
    let count = 0
    let totalPrice = 0
    let totalAbsChange = 0
    for (const t of sector.tickers) {
      const q = quotes[t]
      if (!q) continue
      totalChange += q.changePercent
      totalPrice += q.price
      totalAbsChange += q.change
      count++
    }
    return {
      symbol: sector.symbol,
      name: sector.name,
      value: count ? Math.round(totalPrice / count * 100) / 100 : 0,
      change: count ? Math.round(totalAbsChange / count * 100) / 100 : 0,
      changePercent: count ? Math.round(totalChange / count * 100) / 100 : 0,
    }
  })

  if (loading) {
    return (
      <section data-slot="market-overview">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Market Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section data-slot="market-overview">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Market Overview</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indices.map((index) => (
          <IndexCard key={index.symbol} index={index} />
        ))}
      </div>
    </section>
  )
}

export { MarketOverview }
