"use client"

import { useMemo } from "react"
import { useCryptoStore, type CryptoUpdate } from "@/lib/stores/crypto-store"
import { AssetRow } from "@/components/shared/asset-row"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCryptoPrice, formatPercent, formatVolume } from "@/lib/format"

function CryptoAssetRow({ quote }: { quote: CryptoUpdate }) {
  const flash = usePriceFlash(quote.price)

  const bidAsk =
    quote.bid && quote.ask ? (
      <span>
        Bid {formatCryptoPrice(quote.bid)} / Ask {formatCryptoPrice(quote.ask)}
      </span>
    ) : null

  const exchange = quote.exchange ? (
    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
      {quote.exchange}
    </span>
  ) : null

  return (
    <AssetRow
      variant="card"
      ticker={quote.symbol}
      title={quote.name}
      subtitle={quote.symbol}
      metadata={
        <div className="flex items-center gap-3">
          {bidAsk}
          {exchange}
          {quote.volume > 0 && <span>Vol {formatVolume(quote.volume)}</span>}
        </div>
      }
      logoVariant="currency"
      priceFormatted={formatCryptoPrice(quote.price)}
      changePercent={quote.changePercent}
      flashClassName={flash}
    />
  )
}

function CryptoOverview() {
  const quotes = useCryptoStore((s) => s.quotes)

  const sortedQuotes = useMemo(() => {
    return Object.values(quotes).sort((a, b) => {
      if (b.volume !== a.volume) return b.volume - a.volume
      return b.price - a.price
    })
  }, [quotes])

  const isEmpty = sortedQuotes.length === 0

  if (isEmpty) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sortedQuotes.map((quote) => (
        <CryptoAssetRow key={quote.ticker} quote={quote} />
      ))}
    </div>
  )
}

export { CryptoOverview }
