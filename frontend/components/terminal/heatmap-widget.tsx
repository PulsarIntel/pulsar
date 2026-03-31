"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSymbolQuotes } from "@/lib/hooks/use-market-data"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { isDovizTicker, API_BASE } from "@/lib/constants"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

interface CustomHeatmap {
  id: string
  name: string
  tickers: string[]
}

function HeatmapWidget({ heatmapId }: { heatmapId: string }) {
  const [heatmap, setHeatmap] = useState<CustomHeatmap | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setError(true); return }

    fetch(`${API_BASE}/heatmaps/custom/${heatmapId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setHeatmap)
      .catch(() => setError(true))
  }, [heatmapId])

  if (error) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Heatmap not found</div>
  }

  if (!heatmap) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading...</div>
  }

  return <HeatmapGrid heatmap={heatmap} />
}

function HeatmapGrid({ heatmap }: { heatmap: CustomHeatmap }) {
  const stockTickers = useMemo(() => heatmap.tickers.filter((t) => !isDovizTicker(t)), [heatmap.tickers])
  const { data: stockQuotes } = useSymbolQuotes(stockTickers)
  const dovizQuotes = useDovizStore((s) => s.quotes)

  const getQuote = useCallback((ticker: string) => {
    if (isDovizTicker(ticker)) {
      const d = dovizQuotes[ticker] || dovizQuotes[ticker.toLowerCase()]
      if (d) return { name: d.name, changePercent: d.changePercent, price: d.price || d.ask }
    }
    const q = stockQuotes?.[ticker]
    if (q) return { name: q.name, changePercent: q.changePercent, price: q.price }
    return null
  }, [stockQuotes, dovizQuotes])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium">{heatmap.name}</span>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-px overflow-auto bg-border">
        {heatmap.tickers.map((ticker) => {
          const q = getQuote(ticker)
          const change = q?.changePercent ?? 0
          const positive = change >= 0
          const intensity = Math.min(Math.abs(change) / 4, 1)
          const displayName = q?.name || ticker

          return (
            <div
              key={ticker}
              className={cn(
                "flex flex-col items-center justify-center bg-card px-2 py-2",
                positive ? "hover:bg-positive/5" : "hover:bg-negative/5"
              )}
              style={{
                backgroundColor: positive
                  ? `oklch(0.7 0.15 155 / ${intensity * 0.08})`
                  : `oklch(0.65 0.2 22 / ${intensity * 0.08})`,
              }}
            >
              <span className="text-[10px] font-medium">{displayName}</span>
              <span className={cn("font-mono text-xs font-bold tabular-nums", positive ? "text-positive" : "text-negative")}>
                {q ? formatPercent(change) : "—"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { HeatmapWidget }
