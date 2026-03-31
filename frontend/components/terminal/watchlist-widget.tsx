"use client"

import { useState, useEffect, useCallback, memo } from "react"

import type { Quote } from "@/lib/hooks/use-market-data"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { isDovizTicker, isCryptoTicker, API_BASE } from "@/lib/constants"
import { useCryptoStore } from "@/lib/stores/crypto-store"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency, formatTRY, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TickerLogo } from "@/components/shared/ticker-logo"

const WatchlistRow = memo(function WatchlistRow({ q, isCurrency }: { q: Quote; isCurrency: boolean }) {
  const flash = usePriceFlash(q.price)
  const isUSD = q.ticker === "ons" || q.ticker === "gumus"
  const fmtPrice = isCurrency && !isUSD ? `₺${formatTRY(q.price)}` : formatCurrency(q.price)
  const displayName = isCurrency ? q.name : q.ticker

  return (
    <div className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/50 px-3 py-1 ${flash}`}>
      <div className="flex items-center gap-1.5">
        <TickerLogo ticker={displayName} size="xs" variant={isCurrency ? "currency" : "stock"} />
        <span className="text-xs font-medium">{displayName}</span>
      </div>
      <span className="font-mono text-xs tabular-nums">{q.price ? fmtPrice : "—"}</span>
      <span className={cn("font-mono text-xs tabular-nums", q.changePercent >= 0 ? "text-positive" : "text-negative")}>
        {q.price ? formatPercent(q.changePercent) : "—"}
      </span>
    </div>
  )
})

function WatchlistWidget({ quotes }: { quotes: Record<string, Quote> | null }) {
  const [tickers, setTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const dovizQuotes = useDovizStore((s) => s.quotes)
  const cryptoQuotes = useCryptoStore((s) => s.quotes)

  const fetchList = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API_BASE}/watchlist/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setTickers(await res.json())
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span>Symbol</span><span className="text-right">Price</span><span className="text-right">Chg%</span>
        </div>
        <div className="flex-1 space-y-0.5 p-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (tickers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Watchlist is empty
      </div>
    )
  }

  const items: { quote: Quote; isCurrency: boolean }[] = tickers
    .map((t) => {
      const isCurrency = isDovizTicker(t)
      if (isCurrency) {
        const tLower = t.toLowerCase()
        const d = dovizQuotes[t] || dovizQuotes[tLower]
        if (d) {
          return {
            quote: {
              ticker: t, name: d.name, price: d.price || d.ask,
              change: d.change, changePercent: d.changePercent,
              open: 0, high: 0, low: 0, previousClose: 0, volume: "0", sector: "", industry: "",
            } as Quote,
            isCurrency: true,
          }
        }
      }
      if (isCryptoTicker(t)) {
        const c = cryptoQuotes[t]
        if (c) {
          return {
            quote: {
              ticker: t, name: c.name, price: c.price,
              change: c.change, changePercent: c.changePercent,
              open: 0, high: 0, low: 0, previousClose: 0, volume: String(c.volume), sector: "crypto", industry: "",
            } as Quote,
            isCurrency: false,
          }
        }
      }
      const q = quotes?.[t]
      if (q) return { quote: q, isCurrency: false }
      return null
    })
    .filter(Boolean) as { quote: Quote; isCurrency: boolean }[]

  const missing = tickers.filter((t) => {
    if (isDovizTicker(t)) {
      const tLower = t.toLowerCase()
      return !dovizQuotes[t] && !dovizQuotes[tLower]
    }
    if (isCryptoTicker(t)) return !cryptoQuotes[t]
    return !quotes?.[t]
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
        <span>Symbol</span>
        <span>Price</span>
        <span>Chg%</span>
      </div>
      <div className="flex-1 overflow-auto">
        {items.map(({ quote, isCurrency }) => (
          <WatchlistRow key={quote.ticker} q={quote} isCurrency={isCurrency} />
        ))}
        {missing.map((t) => (
          <div key={t} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/50 px-3 py-1">
            <div className="flex items-center gap-1.5">
              <TickerLogo ticker={t} size="xs" />
              <span className="text-xs font-medium">{t}</span>
            </div>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { WatchlistWidget }
