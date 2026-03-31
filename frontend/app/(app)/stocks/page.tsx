"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { IconSearch } from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { PriceChange } from "@/components/shared/price-change"
import { API_BASE } from "@/lib/constants"
const BATCH = 50

interface Asset {
  ticker: string
  name: string
  exchange: string
}

interface QuoteData {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  sector: string
}

type SortKey = "ticker" | "name" | "exchange"
type SortDir = "asc" | "desc"

export default function StocksPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("ticker")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [visibleCount, setVisibleCount] = useState(BATCH)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_BASE}/market/assets`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAssets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setVisibleCount(BATCH)
  }, [search, sortKey, sortDir])

  const filtered = useMemo(() => {
    let list = assets
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const cmp = a[sortKey].localeCompare(b[sortKey])
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [assets, search, sortKey, sortDir])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => Math.min(prev + BATCH, filtered.length))
        }
      },
      { rootMargin: "400px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, filtered.length])

  const fetchQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return
    try {
      const res = await fetch(`${API_BASE}/market/quotes?symbols=${tickers.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes((prev) => ({ ...prev, ...data }))
      }
    } catch { }
  }, [])

  useEffect(() => {
    const needed = visible
      .map((a) => a.ticker)
      .filter((t) => !quotes[t])
    if (needed.length === 0) return

    const chunks: string[][] = []
    for (let i = 0; i < needed.length; i += 100) {
      chunks.push(needed.slice(i, i + 100))
    }
    chunks.forEach((chunk) => fetchQuotes(chunk))
  }, [visible, quotes, fetchQuotes])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : ""

  return (
    <>
      <Header title="All Stocks" description={`${assets.length.toLocaleString()} tradable US stocks`} />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
          <div className="relative max-w-xs">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ticker or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid-cols-[1fr_80px_auto_auto]">
              <button className="text-left hover:text-foreground" onClick={() => toggleSort("ticker")}>
                Stock{arrow("ticker")}
              </button>
              <button className="hidden text-left hover:text-foreground sm:block" onClick={() => toggleSort("exchange")}>
                Exchange{arrow("exchange")}
              </button>
              <span className="text-right">Price</span>
              <span className="hidden text-right sm:block">Change</span>
            </div>

            {loading ? (
              Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-2 last:border-b-0">
                  <div className="size-7 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                  </div>
                  <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : visible.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No stocks match &quot;{search}&quot;
              </div>
            ) : (
              <>
                {visible.map((asset) => {
                  const q = quotes[asset.ticker]
                  return (
                    <Link
                      key={asset.ticker}
                      href={`/stocks/${asset.ticker}`}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-2 transition-colors last:border-b-0 hover:bg-muted/30 sm:grid-cols-[1fr_80px_auto_auto]"
                    >
                      <div className="flex items-center gap-3">
                        <TickerLogo ticker={asset.ticker} size="sm" />
                        <div>
                          <div className="text-sm font-medium">{asset.ticker}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                      <div className="hidden text-xs text-muted-foreground sm:block">
                        {asset.exchange}
                      </div>
                      <div className="text-right font-mono text-sm font-medium tabular-nums">
                        {q ? formatCurrency(q.price) : "—"}
                      </div>
                      <div className="hidden sm:block">
                        {q ? (
                          <PriceChange change={q.change} changePercent={q.changePercent} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
                {hasMore && (
                  <div ref={sentinelRef} className="flex items-center gap-4 border-b border-border px-4 py-2">
                    <div className="size-7 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                    </div>
                    <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()} stocks
          </div>
        </div>
      </div>
    </>
  )
}
