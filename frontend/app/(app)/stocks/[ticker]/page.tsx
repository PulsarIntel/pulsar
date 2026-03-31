"use client"

import { use, useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { PriceChange } from "@/components/shared/price-change"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { StockChart } from "@/components/stocks/stock-chart"
import { StockMetrics } from "@/components/stocks/stock-metrics"
import { StockNews } from "@/components/stocks/stock-news"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import type { Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { API_BASE } from "@/lib/constants"

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const { ticker } = use(params)
  const upperTicker = ticker.toUpperCase()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const wsSymbols = useMemo(() => [upperTicker], [upperTicker])
  const { updates } = useRealtimeQuotes(wsSymbols)

  const liveQuote = useMemo(() => {
    if (!quote) return null
    const rt = updates[upperTicker]
    if (!rt?.price) return quote
    return { ...quote, price: rt.price }
  }, [quote, updates, upperTicker])

  const flash = usePriceFlash(liveQuote?.price)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/market/quotes?symbols=${upperTicker}`)
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        if (!cancelled && data[upperTicker]) {
          setQuote(data[upperTicker])
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [upperTicker])

  if (loading) {
    return (
      <>
        <Header title={upperTicker} />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="flex items-center gap-4">
              <div className="size-11 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                <div className="flex gap-3">
                  <div className="h-8 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="h-[500px] animate-pulse rounded-xl border border-border bg-card" />
              <div className="space-y-4">
                <div className="h-[240px] animate-pulse rounded-xl border border-border bg-card" />
                <div className="h-[200px] animate-pulse rounded-xl border border-border bg-card" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!liveQuote) {
    return (
      <>
        <Header title="Stock Not Found" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-medium">
              No data for &quot;{upperTicker}&quot;
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try searching for a different stock.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    )
  }

  const isPositive = liveQuote.change >= 0

  return (
    <>
      <Header title={liveQuote.ticker} />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon-sm">
                <IconArrowLeft className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <TickerLogo ticker={liveQuote.ticker} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{liveQuote.name}</h2>
                {liveQuote.sector && <Badge variant="secondary">{liveQuote.sector}</Badge>}
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className={`rounded-md px-1 font-mono text-3xl font-bold tabular-nums tracking-tight ${flash}`}>
                  {formatCurrency(liveQuote.price)}
                </span>
                <PriceChange
                  change={liveQuote.change}
                  changePercent={liveQuote.changePercent}
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="h-[500px] overflow-hidden rounded-xl border border-border bg-card">
                <StockChart ticker={liveQuote.ticker} positive={isPositive} realtimePrice={liveQuote.price} />
              </div>
            </div>

            <div className="space-y-4">
              <StockMetrics
                quote={{
                  ...liveQuote,
                  avgVolume: liveQuote.volume,
                  marketCap: "",
                  peRatio: null,
                  eps: null,
                  beta: null,
                  dividend: null,
                  dividendYield: null,
                  week52High: liveQuote.high,
                  week52Low: liveQuote.low,
                  description: "",
                }}
              />
              <StockNews ticker={liveQuote.ticker} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
