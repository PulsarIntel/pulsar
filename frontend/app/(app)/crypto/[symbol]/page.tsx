"use client"

import { use, useState, useEffect, useMemo, memo } from "react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LightweightChart } from "@/components/charts/lightweight-chart"
import { formatCryptoPrice, formatPercent } from "@/lib/format"
import { useCryptoStore } from "@/lib/stores/crypto-store"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { cn } from "@/lib/utils"
import { API_BASE } from "@/lib/constants"

const CryptoChart = memo(function CryptoChart({ ticker, realtimePrice }: { ticker: string; realtimePrice?: number }) {
  const [range, setRange] = useState("5D")
  const [interval, setInterval] = useState("15m")
  return (
    <LightweightChart
      ticker={ticker}
      range={range}
      interval={interval}
      mode="candlestick"
      realtimePrice={realtimePrice}
      showTimeRanges
      onRangeChange={setRange}
      onIntervalChange={setInterval}
    />
  )
})

export default function CryptoDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = use(params)
  const decodedSymbol = decodeURIComponent(symbol)
  const quotes = useCryptoStore((s) => s.quotes)
  const quote = quotes[decodedSymbol]
  const [bars, setBars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const flash = usePriceFlash(quote?.price)
  const isPositive = (quote?.changePercent ?? 0) >= 0

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/crypto/bars/${encodeURIComponent(decodedSymbol)}?timeframe=1Day&limit=30`)
      .then((r) => r.ok ? r.json() : [])
      .then(setBars)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [decodedSymbol])

  const coinName = quote?.name ?? decodedSymbol.split("/")[0]
  const coinSymbol = quote?.symbol ?? decodedSymbol.split("/")[0]
  const exchange = quote?.exchange ?? "kraken"

  return (
    <div className="flex h-full flex-col overflow-auto">
      <Header
        title={decodedSymbol}
        status={
          <span className="text-xs text-muted-foreground">24/7 Market</span>
        }
      />

      <div className="flex-1 px-6 py-6">
        <Link href="/crypto">
          <Button variant="ghost" size="icon-sm" className="mb-4">
            <IconArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="mb-6 flex items-start gap-4">
          <TickerLogo ticker={coinName} size="lg" variant="crypto" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{coinName}</h2>
              <span className="text-sm text-muted-foreground">{coinSymbol}</span>
              <Badge variant="secondary" className="text-[10px] uppercase">{exchange}</Badge>
            </div>
            {quote && (
              <div className={cn("mt-1 flex items-baseline gap-3", flash)}>
                <span className="font-mono text-3xl font-bold tabular-nums">
                  {formatCryptoPrice(quote.price)}
                </span>
                <span className={cn("font-mono text-sm tabular-nums", isPositive ? "text-positive" : "text-negative")}>
                  {formatPercent(quote.changePercent)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex h-[500px] flex-col border border-border bg-card">
            <CryptoChart ticker={decodedSymbol} realtimePrice={quote?.price} />
          </div>

          <div className="space-y-4">
            <div className="border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Market Data</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Bid</span>
                  <span className="font-mono tabular-nums">{quote ? formatCryptoPrice(quote.bid) : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Ask</span>
                  <span className="font-mono tabular-nums">{quote ? formatCryptoPrice(quote.ask) : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Spread</span>
                  <span className="font-mono tabular-nums">{quote ? formatCryptoPrice(quote.ask - quote.bid) : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-mono tabular-nums">{quote?.volume ? quote.volume.toLocaleString() : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Change</span>
                  <span className={cn("font-mono tabular-nums", isPositive ? "text-positive" : "text-negative")}>
                    {quote ? formatPercent(quote.changePercent) : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Exchange</span>
                  <span className="font-mono uppercase">{exchange}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
