"use client"

import { useMemo } from "react"
import Link from "next/link"

import { useQuotes, type Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency } from "@/lib/format"
import { PriceChange } from "@/components/shared/price-change"
import { AssetRow } from "@/components/shared/asset-row"
import { AssetList } from "@/components/shared/asset-list"

const TRACKED = ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "AMZN", "TSLA", "JPM", "V", "MA", "BAC", "LLY", "UNH", "XOM", "NFLX"]

const COLUMNS = [
  { key: "stock", label: "Stock" },
  { key: "price", label: "Price", align: "right" as const },
  { key: "change", label: "Change", align: "right" as const, hiddenBelow: "sm" as const },
]

function StockRow({ stock }: { stock: Quote }) {
  const flash = usePriceFlash(stock.price)
  return (
    <AssetRow
      variant="row"
      ticker={stock.ticker}
      title={stock.ticker}
      subtitle={stock.name}
      price={stock.price}
      changePercent={stock.changePercent}
      href={`/stocks/${stock.ticker}`}
      flashClassName={flash}
    />
  )
}

function TrendingStocks() {
  const { data: polledQuotes, loading } = useQuotes()
  const { updates: rt } = useRealtimeQuotes(TRACKED)

  const stocks = useMemo(() => {
    if (!polledQuotes) return []
    const merged: Record<string, Quote> = { ...polledQuotes }
    for (const [ticker, u] of Object.entries(rt)) {
      if (u.price && merged[ticker]) {
        merged[ticker] = { ...merged[ticker], price: u.price }
      }
    }
    return Object.values(merged).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  }, [polledQuotes, rt])

  return (
    <section data-slot="trending-stocks">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Trending Stocks</h2>
        {!loading && <Link href="/stocks" className="text-xs font-medium text-primary hover:underline">View All</Link>}
      </div>
      <AssetList columns={COLUMNS} loading={loading} skeletonCount={8}>
        {stocks.map((stock) => (
          <StockRow key={stock.ticker} stock={stock} />
        ))}
      </AssetList>
    </section>
  )
}

export { TrendingStocks }
