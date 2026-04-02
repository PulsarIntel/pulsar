"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"

import type { Quote } from "@/lib/hooks/use-market-data"
import { useSymbolQuotes } from "@/lib/hooks/use-market-data"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { isDovizTicker, isCryptoTicker } from "@/lib/constants"
import { useCryptoStore } from "@/lib/stores/crypto-store"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency, formatTRY, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { fetchPositions } from "@/lib/api/portfolio"
import type { Position } from "@/lib/types"

interface PositionData {
  id: string
  ticker: string
  name: string
  shares: number
  avg_cost: number
  price: number
  totalValue: number
  totalReturn: number
  totalReturnPct: number
  dayChange: number
  isCurrency: boolean
  isTRY: boolean
  totalValueUSD: number
  totalCostUSD: number
}

const PortfolioRow = memo(function PortfolioRow({ p }: { p: PositionData }) {
  const flash = usePriceFlash(p.price)
  const fmtValue = p.isTRY ? `₺${formatTRY(p.totalValue)}` : formatCurrency(p.totalValue)
  const displayName = p.isCurrency ? p.name : p.ticker

  return (
    <div className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/50 px-3 py-1 ${flash}`}>
      <div className="flex items-center gap-1.5 overflow-hidden">
        <TickerLogo ticker={displayName} size="xs" variant={p.isCurrency ? "currency" : "stock"} />
        <span className="truncate text-xs font-medium">{displayName}</span>
      </div>
      <span className="font-mono text-xs tabular-nums">{p.price ? fmtValue : "—"}</span>
      <span className={cn("font-mono text-xs tabular-nums", p.totalReturn >= 0 ? "text-positive" : "text-negative")}>
        {p.price ? formatPercent(p.totalReturnPct) : "—"}
      </span>
    </div>
  )
})

function PortfolioWidget({ quotes }: { quotes: Record<string, Quote> | null }) {
  const [positionsList, setPositionsList] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const dovizQuotes = useDovizStore((s) => s.quotes)
  const cryptoQuotes = useCryptoStore((s) => s.quotes)

  const loadPositions = useCallback(async () => {
    try {
      const data = await fetchPositions()
      setPositionsList(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPositions() }, [loadPositions])

  const stockTickers = useMemo(
    () => positionsList
      .map((p) => p.ticker)
      .filter((t) => !isDovizTicker(t) && !isCryptoTicker(t)),
    [positionsList],
  )
  const { data: positionQuotes } = useSymbolQuotes(stockTickers)

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-0.5 p-3">
        <div className="mb-2 h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 animate-pulse rounded bg-muted/50" />
        ))}
      </div>
    )
  }

  if (positionsList.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No holdings yet
      </div>
    )
  }

  const usdTryQuote = dovizQuotes["USD"] || dovizQuotes["usd"]
  const usdTryRate = usdTryQuote?.price || usdTryQuote?.ask || 0

  const positions: PositionData[] = positionsList.map((h) => {
    const isCurrency = isDovizTicker(h.ticker)
    const isTRY = h.currency === "TRY" || isCurrency

    let price = 0
    let name = h.ticker
    let changePercent = 0

    if (isCurrency) {
      const tLower = h.ticker.toLowerCase()
      const d = dovizQuotes[h.ticker] || dovizQuotes[tLower]
      if (d) {
        price = d.price || d.ask
        name = d.name
        changePercent = d.changePercent
      }
    } else if (isCryptoTicker(h.ticker)) {
      const c = cryptoQuotes[h.ticker]
      if (c) {
        price = c.price
        name = c.name
        changePercent = c.changePercent
      }
    } else {
      const q = quotes?.[h.ticker] || positionQuotes?.[h.ticker]
      if (q) {
        price = q.price
        name = q.name
        changePercent = q.changePercent
      }
    }

    const totalValue = price * h.total_shares
    const totalCost = h.avg_cost * h.total_shares
    const totalReturn = totalValue - totalCost
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
    const toUSD = isTRY && usdTryRate > 0 ? 1 / usdTryRate : 1

    return {
      id: h.id,
      ticker: h.ticker,
      name,
      shares: h.total_shares,
      avg_cost: h.avg_cost,
      price,
      totalValue,
      totalReturn,
      totalReturnPct,
      dayChange: changePercent,
      isCurrency,
      isTRY,
      totalValueUSD: totalValue * toUSD,
      totalCostUSD: totalCost * toUSD,
    }
  })

  const totalValue = positions.reduce((s, p) => s + p.totalValueUSD, 0)
  const totalCost = positions.reduce((s, p) => s + p.totalCostUSD, 0)
  const totalReturn = totalValue - totalCost
  const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
  const dayChange = positions.reduce((s, p) => s + (p.price * p.shares * p.dayChange / 100 * (p.isTRY && usdTryRate > 0 ? 1 / usdTryRate : 1)), 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-3 py-2">
        <div className="font-mono text-base font-bold tabular-nums">{formatCurrency(totalValue)}</div>
        <div className="flex gap-3 text-[10px]">
          <span className={cn("font-mono tabular-nums", dayChange >= 0 ? "text-positive" : "text-negative")}>
            {dayChange >= 0 ? "+" : ""}{formatCurrency(dayChange)} today
          </span>
          <span className={cn("font-mono tabular-nums", totalReturn >= 0 ? "text-positive" : "text-negative")}>
            {formatPercent(totalReturnPct)} total
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-3 py-1 text-[9px] font-medium text-muted-foreground">
        <span>Stock</span><span>Value</span><span>Return</span>
      </div>
      <div className="flex-1 overflow-auto">
        {positions.map((p) => (
          <PortfolioRow key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}

export { PortfolioWidget }
