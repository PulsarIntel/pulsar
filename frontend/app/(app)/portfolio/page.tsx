"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  IconChartPie,
  IconPlus,
  IconLoader2,
} from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary"
import { PositionRow, type EnrichedPosition } from "@/components/portfolio/position-row"
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog"
import { AuthGate } from "@/components/shared/auth-gate"
import { useAllQuotes, useSymbolQuotes, type Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { useCryptoStore } from "@/lib/stores/crypto-store"
import { generateSparkline } from "@/lib/mock-data"
import { isDovizTicker, isCryptoTicker } from "@/lib/constants"
import { fetchPositions, migrateHoldings } from "@/lib/api/portfolio"
import type { Portfolio, Position } from "@/lib/types"

export default function PortfolioPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)

  const holdingTickers = useMemo(() => positions.map((p) => p.ticker), [positions])

  const stockTickers = useMemo(
    () => holdingTickers.filter((t) => !isDovizTicker(t) && !isCryptoTicker(t)),
    [holdingTickers],
  )
  const { data: allQuotes } = useAllQuotes()
  const { data: specificQuotes } = useSymbolQuotes(stockTickers)
  const { updates: rt } = useRealtimeQuotes(stockTickers)
  const dovizQuotes = useDovizStore((s) => s.quotes)
  const cryptoQuotes = useCryptoStore((s) => s.quotes)

  const usdTryRate = useMemo(() => {
    const usdQuote = dovizQuotes["USD"] || dovizQuotes["usd"]
    return usdQuote?.price || usdQuote?.ask || 0
  }, [dovizQuotes])

  const quotes = useMemo(() => {
    const merged: Record<string, Quote> = {}

    for (const t of stockTickers) {
      const q = allQuotes?.[t] || specificQuotes?.[t]
      if (q) {
        const r = rt[t]
        merged[t] = r?.price ? { ...q, price: r.price } : q
      }
    }

    for (const t of holdingTickers) {
      if (!isDovizTicker(t)) continue
      const tLower = t.toLowerCase()
      const d = dovizQuotes[t] || dovizQuotes[tLower]
      if (d) {
        merged[t] = {
          ticker: t, name: d.name, price: d.price || d.ask,
          change: d.change, changePercent: d.changePercent,
          open: 0, high: d.high || 0, low: d.low || 0, previousClose: 0,
          volume: "0", sector: d.category || "", industry: "",
        }
      }
    }

    for (const t of holdingTickers) {
      if (!isCryptoTicker(t)) continue
      const c = cryptoQuotes[t]
      if (c) {
        merged[t] = {
          ticker: t, name: c.name, price: c.price,
          change: c.change, changePercent: c.changePercent,
          open: 0, high: 0, low: 0, previousClose: 0,
          volume: String(c.volume), sector: "crypto", industry: "",
        }
      }
    }

    return merged
  }, [holdingTickers, stockTickers, allQuotes, specificQuotes, rt, dovizQuotes, cryptoQuotes])

  const fetchData = useCallback(async () => {
    try {
      let pos = await fetchPositions()
      if (pos.length === 0) {
        const result = await migrateHoldings()
        if (result.migrated > 0) {
          pos = await fetchPositions()
        }
      }
      setPositions(pos)
    } catch {
    } finally {
      setLoadingPositions(false)
    }
  }, [])

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("token")
    setIsLoggedIn(loggedIn)
    if (loggedIn) fetchData()
    else setLoadingPositions(false)
  }, [fetchData])

  if (isLoggedIn === null || (isLoggedIn && loadingPositions)) {
    return (
      <>
        <Header title="Portfolio" description="Track your positions and performance" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        <Header title="Portfolio" description="Track your positions and performance" />
        <div className="flex-1 overflow-auto">
          <AuthGate
            icon={<IconChartPie className="size-8 text-muted-foreground" />}
            title="Sign in to view your portfolio"
            description="Track your holdings, monitor performance, and get personalized insights."
          />
        </div>
      </>
    )
  }

  if (positions.length === 0) {
    return (
      <>
        <Header title="Portfolio" description="Track your positions and performance" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <IconPlus className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Your portfolio is empty</h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Add your first transaction to start tracking performance.
            </p>
            <Button size="lg" onClick={() => setShowAdd(true)}>
              <IconPlus className="size-4" />
              Add Transaction
            </Button>
          </div>
          {showAdd && (
            <AddTransactionDialog onClose={() => setShowAdd(false)} onAdded={fetchData} />
          )}
        </div>
      </>
    )
  }

  const enrichedPositions: EnrichedPosition[] = positions.map((p) => {
    const q = quotes?.[p.ticker] || quotes?.[p.ticker.toLowerCase()] || quotes?.[p.ticker.toUpperCase()]
    const currentPrice = q?.price ?? 0
    const isTRY = p.currency === "TRY"
    const totalValue = currentPrice * p.total_shares
    const totalReturn = totalValue - p.total_invested
    const totalReturnPercent = p.total_invested > 0 ? (totalReturn / p.total_invested) * 100 : 0
    const dayChange = (q?.change ?? 0) * p.total_shares
    const dayChangePercent = q?.changePercent ?? 0
    const toUSD = isTRY && usdTryRate > 0 ? 1 / usdTryRate : 1
    return {
      ...p,
      name: q?.name ?? p.ticker,
      currentPrice,
      totalValue,
      totalReturn,
      totalReturnPercent,
      dayChange,
      dayChangePercent,
      totalValueUSD: totalValue * toUSD,
      totalInvestedUSD: p.total_invested * toUSD,
      dayChangeUSD: dayChange * toUSD,
      realizedPnlUSD: p.realized_pnl * toUSD,
    }
  })

  const totalValue = enrichedPositions.reduce((s, p) => s + (p as any).totalValueUSD, 0)
  const totalCost = enrichedPositions.reduce((s, p) => s + (p as any).totalInvestedUSD, 0)
  const dayChange = enrichedPositions.reduce((s, p) => s + (p as any).dayChangeUSD, 0)
  const totalReturn = totalValue - totalCost
  const realizedPnl = enrichedPositions.reduce((s, p) => s + (p as any).realizedPnlUSD, 0)

  const portfolio: Portfolio = {
    totalValue,
    totalCost,
    dayChange,
    dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
    totalReturn,
    totalReturnPercent: totalCost > 0 ? (totalReturn / totalCost) * 100 : 0,
    realizedPnl,
    positions: enrichedPositions.map((p) => ({
      ticker: p.ticker,
      name: p.name,
      shares: p.total_shares,
      avgCost: p.avg_cost,
      currentPrice: p.currentPrice,
      totalValue: p.totalValue,
      totalReturn: p.totalReturn,
      totalReturnPercent: p.totalReturnPercent,
      dayChange: p.dayChange,
      dayChangePercent: p.dayChangePercent,
      realizedPnl: p.realized_pnl,
      transactionCount: p.transaction_count,
      sector: "",
      sparkline: generateSparkline(p.currentPrice || 100, 20),
    })),
  }

  return (
    <>
      <Header title="Portfolio" description="Track your positions and performance" />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
          <PortfolioSummary portfolio={portfolio} />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Positions ({positions.length})
              </h2>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <IconPlus className="size-3.5" />
                Add
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {enrichedPositions.map((pos) => (
                <PositionRow
                  key={pos.id}
                  position={pos}
                  expanded={expandedTicker === pos.ticker}
                  onToggle={() =>
                    setExpandedTicker(expandedTicker === pos.ticker ? null : pos.ticker)
                  }
                  onTransactionChange={fetchData}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
      {showAdd && (
        <AddTransactionDialog onClose={() => setShowAdd(false)} onAdded={fetchData} />
      )}
    </>
  )
}
