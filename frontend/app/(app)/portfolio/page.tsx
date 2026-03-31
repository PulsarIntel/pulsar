"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  IconChartPie,
  IconPlus,
  IconLoader2,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary"
import { AssetRow } from "@/components/shared/asset-row"
import { AssetList } from "@/components/shared/asset-list"
import { AuthGate } from "@/components/shared/auth-gate"
import { StockPicker } from "@/components/shared/stock-picker"
import { useAllQuotes, useSymbolQuotes, type Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency, formatPercent, formatTRY } from "@/lib/format"
import { generateSparkline } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Portfolio } from "@/lib/types"

import { isDovizTicker, isCryptoTicker, API_BASE } from "@/lib/constants"
import { useCryptoStore } from "@/lib/stores/crypto-store"

interface Holding {
  id: string
  ticker: string
  shares: number
  avg_cost: number
  bought_at: string
  currency: string
}

interface Position {
  id: string
  ticker: string
  name: string
  shares: number
  avg_cost: number
  bought_at: string
  currency: string
  currentPrice: number
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
}

function HoldingRow({ pos, onDelete, deleting }: { pos: Position; onDelete: (id: string) => void; deleting: boolean }) {
  const flash = usePriceFlash(pos.currentPrice)
  const isTotalPositive = pos.totalReturn >= 0
  const isDayPositive = pos.dayChange >= 0
  const isTRY = pos.currency === "TRY"
  const fmtPrice = (v: number) => isTRY ? `₺${formatTRY(v)}` : formatCurrency(v)
  const isCurrency = isTRY || isDovizTicker(pos.ticker)
  const href = isCurrency ? "/currencies" : `/stocks/${pos.ticker}`

  return (
    <AssetRow
      variant="card"
      ticker={isCurrency ? pos.name : pos.ticker}
      title={isCurrency ? pos.name : pos.ticker}
      subtitle={isCurrency ? undefined : pos.name}
      logoVariant={isCurrency ? "currency" : "stock"}
      priceFormatted={fmtPrice(pos.totalValue)}
      changePercent={pos.totalReturnPercent}
      secondaryBadge={
        <span className={cn("rounded-sm px-1 py-0.5 font-mono text-[10px] tabular-nums", isDayPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative")}>
          {formatPercent(pos.dayChangePercent)}
        </span>
      }
      metadata={
        <>
          <span>{pos.shares} {isCurrency ? "units" : "shares"}</span>
          <span>Avg {fmtPrice(pos.avg_cost)}</span>
          <span>Bought {pos.bought_at}</span>
        </>
      }
      href={href}
      flashClassName={flash}
      action={
        <Button variant="ghost" size="icon-sm" onClick={() => onDelete(pos.id)} disabled={deleting}>
          {deleting ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconTrash className="size-3.5 text-muted-foreground" />}
        </Button>
      }
    />
  )
}

function AddHoldingDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [ticker, setTicker] = useState("")
  const [assetType, setAssetType] = useState<"stock" | "currency" | "crypto">("stock")
  const [priceCurrency, setPriceCurrency] = useState<"USD" | "TRY">("USD")
  const [shares, setShares] = useState("")
  const [avgCost, setAvgCost] = useState("")
  const [boughtAt, setBoughtAt] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleTypeChange(type: "stock" | "currency" | "crypto") {
    setAssetType(type)
    setPriceCurrency(type === "currency" ? "TRY" : "USD")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!ticker) { setError("Select an asset"); return }
    if (!shares || Number(shares) <= 0) { setError("Shares must be positive"); return }
    if (!avgCost || Number(avgCost) <= 0) { setError("Price must be positive"); return }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE}/portfolio/holdings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker,
          shares: Number(shares),
          avg_cost: Number(avgCost),
          bought_at: boughtAt,
          currency: priceCurrency,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || data.detail || "Failed to add holding")
        return
      }
      onAdded()
      onClose()
    } catch {
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Holding</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <IconX className="size-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-sm text-negative">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Asset</label>
            <StockPicker value={ticker} onChange={setTicker} onTypeChange={handleTypeChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{assetType === "currency" ? "Amount" : "Shares"}</label>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder="100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Avg. Price ({priceCurrency === "TRY" ? "₺" : "$"})
                </label>
                {assetType === "currency" && (
                  <div className="flex items-center gap-0.5 rounded bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setPriceCurrency("TRY")}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        priceCurrency === "TRY" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      ₺ TRY
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceCurrency("USD")}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        priceCurrency === "USD" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      $ USD
                    </button>
                  </div>
                )}
              </div>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder={priceCurrency === "TRY" ? "6400.00" : "150.00"}
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Purchase Date</label>
            <DatePicker value={boughtAt} onChange={setBoughtAt} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconPlus className="size-4" />
              )}
              Add Holding
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loadingHoldings, setLoadingHoldings] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const holdingTickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  const stockTickers = useMemo(() => holdingTickers.filter((t) => !isDovizTicker(t) && !isCryptoTicker(t)), [holdingTickers])
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

  const fetchHoldings = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/portfolio/holdings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setHoldings(await res.json())
      }
    } catch {
    } finally {
      setLoadingHoldings(false)
    }
  }, [])

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("token")
    setIsLoggedIn(loggedIn)
    if (loggedIn) fetchHoldings()
    else setLoadingHoldings(false)
  }, [fetchHoldings])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const token = localStorage.getItem("token")
    try {
      await fetch(`${API_BASE}/portfolio/holdings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setHoldings((h) => h.filter((x) => x.id !== id))
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoggedIn === null || (isLoggedIn && loadingHoldings)) {
    return (
      <>
        <Header title="Portfolio" description="Track your positions and performance" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
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

  if (holdings.length === 0) {
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
              Add your first holding to start tracking performance.
            </p>
            <Button size="lg" onClick={() => setShowAdd(true)}>
              <IconPlus className="size-4" />
              Add Holding
            </Button>
          </div>
          {showAdd && (
            <AddHoldingDialog onClose={() => setShowAdd(false)} onAdded={fetchHoldings} />
          )}
        </div>
      </>
    )
  }

  const positions = holdings.map((h) => {
    const q = quotes?.[h.ticker] || quotes?.[h.ticker.toLowerCase()] || quotes?.[h.ticker.toUpperCase()]
    const currentPrice = q?.price ?? 0
    const isTRY = h.currency === "TRY"
    const totalValue = currentPrice * h.shares
    const totalCost = h.avg_cost * h.shares
    const totalReturn = totalValue - totalCost
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
    const dayChange = (q?.change ?? 0) * h.shares
    const dayChangePercent = q?.changePercent ?? 0
    const toUSD = isTRY && usdTryRate > 0 ? 1 / usdTryRate : 1
    return {
      ...h,
      name: q?.name ?? h.ticker,
      currentPrice,
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercent,
      dayChange,
      dayChangePercent,
      totalValueUSD: totalValue * toUSD,
      totalCostUSD: totalCost * toUSD,
      dayChangeUSD: dayChange * toUSD,
      sparkline: generateSparkline(currentPrice || 100, 20),
    }
  })

  const totalValue = positions.reduce((s, p) => s + p.totalValueUSD, 0)
  const totalCost = positions.reduce((s, p) => s + p.totalCostUSD, 0)
  const dayChange = positions.reduce((s, p) => s + p.dayChangeUSD, 0)
  const totalReturn = totalValue - totalCost

  const portfolio: Portfolio = {
    totalValue,
    totalCost,
    dayChange,
    dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
    totalReturn,
    totalReturnPercent: totalCost > 0 ? (totalReturn / totalCost) * 100 : 0,
    positions: positions.map((p) => ({
      ticker: p.ticker,
      name: p.name,
      shares: p.shares,
      avgCost: p.avg_cost,
      currentPrice: p.currentPrice,
      totalValue: p.totalValue,
      totalReturn: p.totalReturn,
      totalReturnPercent: p.totalReturnPercent,
      dayChange: p.dayChange,
      dayChangePercent: p.dayChangePercent,
      sector: "",
      sparkline: p.sparkline,
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
                Holdings ({holdings.length})
              </h2>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <IconPlus className="size-3.5" />
                Add
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {positions.map((pos) => (
                <HoldingRow key={pos.id} pos={pos} onDelete={handleDelete} deleting={deletingId === pos.id} />
              ))}
            </div>
          </section>
        </div>
      </div>
      {showAdd && (
        <AddHoldingDialog onClose={() => setShowAdd(false)} onAdded={fetchHoldings} />
      )}
    </>
  )
}
